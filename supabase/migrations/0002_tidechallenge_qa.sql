-- ═══════════════════════════════════════════════════════════════════════════
-- TideChallenge Q&A
--
-- Modelled on the FIRST Q&A systems (frc-qa / ftc-qa):
--   · anyone can read published answers, no login needed;
--   · only registered teams can ask: one account per team, team number as the
--     user and a unique code (issued by TideCrew) as the password;
--   · one question per post, max 500 characters, tied to a section of the
--     manual and the rules it is about;
--   · while typing, similar questions are suggested to avoid duplicates;
--   · every question is answered by the Game Design Team and published with a
--     public number (Q1, Q2…); duplicates point to the original.
--
-- Security model: the tables live in the private `qa` schema with RLS on and
-- no policies, so the browser can't touch them directly. Everything goes
-- through SECURITY DEFINER functions below, which check a session token.
-- Passwords and codes are stored only as bcrypt hashes.
--
-- Admin accounts and team codes are NOT in this file (no secrets in git);
-- create them from the admin panel or with qa_admin_upsert_team().
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create schema if not exists qa;
revoke all on schema qa from public, anon, authenticated;

create table if not exists qa.teams (
  id          bigint generated always as identity primary key,
  number      text not null unique check (number ~ '^[0-9]{1,6}$'),
  name        text not null default '',
  code_hash   text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists qa.admins (
  id          bigint generated always as identity primary key,
  username    text not null unique,
  pass_hash   text not null,
  created_at  timestamptz not null default now()
);

create table if not exists qa.sessions (
  token       uuid primary key default gen_random_uuid(),
  team_id     bigint references qa.teams on delete cascade,
  admin_id    bigint references qa.admins on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  check ((team_id is null) <> (admin_id is null))
);

create table if not exists qa.login_attempts (
  id   bigint generated always as identity primary key,
  who  text not null,
  ok   boolean not null,
  at   timestamptz not null default now()
);
create index if not exists login_attempts_who_at on qa.login_attempts (who, at desc);

create table if not exists qa.settings (
  key   text primary key,
  value text not null
);
insert into qa.settings (key, value) values
  ('mode', 'auto'),                                 -- auto | open | closed
  ('opens_at', '2026-10-30T16:15:00-06:00'),
  ('closes_at', '2026-11-20T23:59:00-06:00')
on conflict (key) do nothing;

create sequence if not exists qa.public_number_seq;

create table if not exists qa.questions (
  id             bigint generated always as identity primary key,
  public_number  int unique,
  team_id        bigint not null references qa.teams,
  section        text not null check (section in ('general', 'juego', 'robot', 'campo', 'torneo')),
  rules          text[] not null default '{}',
  title          text not null check (char_length(title) between 8 and 120),
  body           text not null check (char_length(body) between 20 and 500),
  status         text not null default 'pending' check (status in ('pending', 'answered', 'declined')),
  answer         text,
  answer_rules   text[] not null default '{}',
  duplicate_of   bigint references qa.questions,
  hidden         boolean not null default false,
  created_at     timestamptz not null default now(),
  answered_at    timestamptz,
  search         tsvector generated always as (to_tsvector('spanish', title || ' ' || body)) stored
);
create index if not exists questions_search on qa.questions using gin (search);
create index if not exists questions_status on qa.questions (status, hidden);

alter table qa.teams enable row level security;
alter table qa.admins enable row level security;
alter table qa.sessions enable row level security;
alter table qa.login_attempts enable row level security;
alter table qa.settings enable row level security;
alter table qa.questions enable row level security;

-- ── Internal helpers ────────────────────────────────────────────────────────
create or replace function qa._norm(t text) returns text
language sql stable set search_path = qa, extensions, public as $$
  select lower(extensions.unaccent(coalesce(t, '')))
$$;

create or replace function qa._team(p_token uuid) returns bigint
language plpgsql stable set search_path = qa, public as $$
declare v bigint;
begin
  select s.team_id into v from qa.sessions s join qa.teams t on t.id = s.team_id
   where s.token = p_token and s.expires_at > now() and t.active;
  if v is null then raise exception 'SESSION' using hint = 'Tu sesión expiró. Vuelve a entrar.'; end if;
  return v;
end $$;

create or replace function qa._admin(p_token uuid) returns bigint
language plpgsql stable set search_path = qa, public as $$
declare v bigint;
begin
  select admin_id into v from qa.sessions where token = p_token and expires_at > now() and admin_id is not null;
  if v is null then raise exception 'SESSION' using hint = 'Tu sesión expiró. Vuelve a entrar.'; end if;
  return v;
end $$;

create or replace function qa._is_open() returns boolean
language sql stable set search_path = qa, public as $$
  select case (select value from qa.settings where key = 'mode')
    when 'open' then true
    when 'closed' then false
    else now() between (select value::timestamptz from qa.settings where key = 'opens_at')
                   and (select value::timestamptz from qa.settings where key = 'closes_at')
  end
$$;

create or replace function qa._new_code() returns text
language plpgsql volatile set search_path = qa, extensions, public as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  out text := '';
begin
  for i in 0..7 loop out := out || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1); end loop;
  return out;
end $$;

-- Public row shape for a question.
create or replace function qa._row(q qa.questions) returns json
language sql stable set search_path = qa, public as $$
  select json_build_object(
    'id', q.id,
    'number', q.public_number,
    'team', (select number from qa.teams where id = q.team_id),
    'section', q.section,
    'rules', q.rules,
    'title', q.title,
    'body', q.body,
    'status', q.status,
    'answer', q.answer,
    'answer_rules', q.answer_rules,
    'duplicate_of', (select public_number from qa.questions d where d.id = q.duplicate_of),
    'created_at', q.created_at,
    'answered_at', q.answered_at
  )
$$;

-- ── Public API ──────────────────────────────────────────────────────────────
create or replace function public.qa_status() returns json
language sql stable security definer set search_path = qa, public as $$
  select json_build_object(
    'open', qa._is_open(),
    'mode', (select value from qa.settings where key = 'mode'),
    'opens_at', (select value from qa.settings where key = 'opens_at'),
    'closes_at', (select value from qa.settings where key = 'closes_at'),
    'published', (select count(*) from qa.questions where status <> 'pending' and not hidden)
  )
$$;

-- Logins return failures as JSON instead of raising: a raise would roll back
-- the recorded attempt, and throttling (8 failures / 15 min) would never trigger.
create or replace function public.qa_team_login(p_number text, p_code text) returns json
language plpgsql security definer set search_path = qa, extensions, public as $$
declare
  t qa.teams;
  v_who text := 'team:' || trim(coalesce(p_number, ''));
  tok uuid;
  exp timestamptz := now() + interval '12 hours';
begin
  if (select count(*) from qa.login_attempts a where a.who = v_who and not a.ok and a.at > now() - interval '15 minutes') >= 8 then
    return json_build_object('error', 'THROTTLED', 'hint', 'Demasiados intentos. Espera 15 minutos.');
  end if;
  select * into t from qa.teams where number = trim(p_number) and active;
  if t.id is null or t.code_hash <> extensions.crypt(upper(trim(coalesce(p_code, ''))), t.code_hash) then
    insert into qa.login_attempts (who, ok) values (v_who, false);
    return json_build_object('error', 'LOGIN', 'hint', 'Número de equipo o código incorrectos.');
  end if;
  insert into qa.login_attempts (who, ok) values (v_who, true);
  insert into qa.sessions (team_id, expires_at) values (t.id, exp) returning token into tok;
  return json_build_object('token', tok, 'number', t.number, 'name', t.name, 'expires_at', exp);
end $$;

create or replace function public.qa_admin_login(p_user text, p_pass text) returns json
language plpgsql security definer set search_path = qa, extensions, public as $$
declare
  a qa.admins;
  v_who text := 'admin:' || lower(trim(coalesce(p_user, '')));
  tok uuid;
  exp timestamptz := now() + interval '8 hours';
begin
  if (select count(*) from qa.login_attempts l where l.who = v_who and not l.ok and l.at > now() - interval '15 minutes') >= 8 then
    return json_build_object('error', 'THROTTLED', 'hint', 'Demasiados intentos. Espera 15 minutos.');
  end if;
  select * into a from qa.admins where lower(username) = lower(trim(p_user));
  if a.id is null or a.pass_hash <> extensions.crypt(coalesce(p_pass, ''), a.pass_hash) then
    insert into qa.login_attempts (who, ok) values (v_who, false);
    return json_build_object('error', 'LOGIN', 'hint', 'Usuario o contraseña incorrectos.');
  end if;
  insert into qa.login_attempts (who, ok) values (v_who, true);
  insert into qa.sessions (admin_id, expires_at) values (a.id, exp) returning token into tok;
  return json_build_object('token', tok, 'username', a.username, 'expires_at', exp);
end $$;

create or replace function public.qa_logout(p_token uuid) returns void
language sql security definer set search_path = qa, public as $$
  delete from qa.sessions where token = p_token
$$;

-- Published questions (answered or declined), newest first, with optional search.
create or replace function public.qa_public_list(p_search text default null, p_section text default null, p_limit int default 100, p_offset int default 0)
returns json language plpgsql stable security definer set search_path = qa, extensions, public as $$
declare
  s text := nullif(trim(coalesce(p_search, '')), '');
  num int := case when s ~ '^[Qq]?[0-9]+$' then regexp_replace(s, '\D', '', 'g')::int end;
begin
  return coalesce((
    select json_agg(qa._row(q.qrow) order by q.rank desc, (q.qrow).public_number desc)
    from (
      select x as qrow,
        case when s is null then 0
             else ts_rank(x.search, websearch_to_tsquery('spanish', s))
                + extensions.word_similarity(qa._norm(s), qa._norm(x.title || ' ' || x.body)) end as rank
      from qa.questions x
      where x.status <> 'pending' and not x.hidden
        and (p_section is null or x.section = p_section)
        and (s is null
             or x.public_number = num
             or x.search @@ websearch_to_tsquery('spanish', s)
             or extensions.word_similarity(qa._norm(s), qa._norm(x.title || ' ' || x.body)) > 0.35
             or exists (select 1 from unnest(x.rules || x.answer_rules) r where lower(r) = lower(s)))
      order by rank desc, x.public_number desc
      limit greatest(1, least(p_limit, 200)) offset greatest(0, p_offset)
    ) q
  ), '[]'::json);
end $$;

-- "Similar questions" while a team types (title and/or body). Includes pending
-- ones so a team can see it was already asked and wait for that answer.
create or replace function public.qa_similar(p_text text, p_exclude bigint default null)
returns json language plpgsql stable security definer set search_path = qa, extensions, public as $$
declare
  s text := trim(coalesce(p_text, ''));
  n text := qa._norm(s);
begin
  if char_length(s) < 6 then return '[]'::json; end if;
  return coalesce((
    select json_agg(t.j order by t.score desc)
    from (
      select r.j, r.score from (
        select qa._row(x) as j,
          greatest(extensions.similarity(qa._norm(x.title), n),
                   extensions.word_similarity(n, qa._norm(x.title || ' ' || x.body)) * 0.9)
          + coalesce(ts_rank(x.search, plainto_tsquery('spanish', s)), 0) * 2 as score
        from qa.questions x
        where not x.hidden and (p_exclude is null or x.id <> p_exclude)
      ) r
      where r.score > 0.28
      order by r.score desc
      limit 5
    ) t
  ), '[]'::json);
end $$;

create or replace function public.qa_ask(p_token uuid, p_section text, p_rules text[], p_title text, p_body text)
returns json language plpgsql security definer set search_path = qa, public as $$
declare
  team bigint := qa._team(p_token);
  q qa.questions;
begin
  if not qa._is_open() then raise exception 'CLOSED' using hint = 'El Q&A está cerrado en este momento.'; end if;
  if (select count(*) from qa.questions where team_id = team and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'LIMIT' using hint = 'Cada equipo puede enviar hasta 3 preguntas cada 24 horas.';
  end if;
  insert into qa.questions (team_id, section, rules, title, body)
  values (team, p_section,
          coalesce((select array_agg(distinct upper(trim(r))) from unnest(p_rules) r where trim(r) <> ''), '{}'),
          trim(p_title), trim(p_body))
  returning * into q;
  return qa._row(q);
end $$;

create or replace function public.qa_my_questions(p_token uuid) returns json
language plpgsql stable security definer set search_path = qa, public as $$
declare team bigint := qa._team(p_token);
begin
  return coalesce((select json_agg(qa._row(q) order by q.created_at desc) from qa.questions q where q.team_id = team), '[]'::json);
end $$;

-- ── Admin API ───────────────────────────────────────────────────────────────
create or replace function public.qa_admin_queue(p_token uuid, p_status text default null) returns json
language plpgsql stable security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  return coalesce((
    select json_agg((qa._row(q)::jsonb || jsonb_build_object('hidden', q.hidden))::json
                    order by (q.status = 'pending') desc, q.created_at desc)
    from qa.questions q where p_status is null or q.status = p_status
  ), '[]'::json);
end $$;

create or replace function public.qa_admin_answer(p_token uuid, p_id bigint, p_status text, p_answer text, p_rules text[] default '{}', p_duplicate_of int default null)
returns json language plpgsql security definer set search_path = qa, public as $$
declare q qa.questions;
begin
  perform qa._admin(p_token);
  if p_status not in ('answered', 'declined') then raise exception 'STATUS'; end if;
  if char_length(trim(coalesce(p_answer, ''))) < 2 then raise exception 'EMPTY' using hint = 'Escribe la respuesta.'; end if;
  update qa.questions set
    status = p_status,
    answer = trim(p_answer),
    answer_rules = coalesce((select array_agg(distinct upper(trim(r))) from unnest(p_rules) r where trim(r) <> ''), '{}'),
    duplicate_of = (select id from qa.questions where public_number = p_duplicate_of),
    answered_at = coalesce(answered_at, now()),
    public_number = coalesce(public_number, nextval('qa.public_number_seq'))
  where id = p_id returning * into q;
  if q.id is null then raise exception 'NOT_FOUND'; end if;
  return qa._row(q);
end $$;

create or replace function public.qa_admin_set_hidden(p_token uuid, p_id bigint, p_hidden boolean) returns void
language plpgsql security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  update qa.questions set hidden = p_hidden where id = p_id;
end $$;

create or replace function public.qa_admin_teams(p_token uuid) returns json
language plpgsql stable security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  return coalesce((
    select json_agg(json_build_object(
      'number', t.number, 'name', t.name, 'active', t.active, 'created_at', t.created_at,
      'questions', (select count(*) from qa.questions q where q.team_id = t.id),
      'last_login', (select max(at) from qa.login_attempts a where a.who = 'team:' || t.number and a.ok)
    ) order by t.number::int)
    from qa.teams t
  ), '[]'::json);
end $$;

-- Create a team or give it a new code. Pass p_code = null to generate one.
-- Returns the code in clear text exactly once; only its hash is stored.
create or replace function public.qa_admin_upsert_team(p_token uuid, p_number text, p_name text, p_code text default null)
returns json language plpgsql security definer set search_path = qa, extensions, public as $$
declare code text := upper(trim(coalesce(nullif(p_code, ''), qa._new_code())));
begin
  perform qa._admin(p_token);
  insert into qa.teams (number, name, code_hash)
  values (trim(p_number), coalesce(trim(p_name), ''), extensions.crypt(code, extensions.gen_salt('bf', 10)))
  on conflict (number) do update set
    name = case when coalesce(trim(excluded.name), '') = '' then qa.teams.name else excluded.name end,
    code_hash = excluded.code_hash, active = true;
  -- A new code signs the team out everywhere.
  update qa.sessions set expires_at = now() where team_id = (select id from qa.teams where number = trim(p_number));
  return json_build_object('number', trim(p_number), 'code', code);
end $$;

create or replace function public.qa_admin_team_active(p_token uuid, p_number text, p_active boolean) returns void
language plpgsql security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  update qa.teams set active = p_active where number = p_number;
  if not p_active then update qa.sessions set expires_at = now() where team_id = (select id from qa.teams where number = p_number); end if;
end $$;

create or replace function public.qa_admin_set_mode(p_token uuid, p_mode text) returns json
language plpgsql security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  if p_mode not in ('auto', 'open', 'closed') then raise exception 'MODE'; end if;
  update qa.settings set value = p_mode where key = 'mode';
  return public.qa_status();
end $$;

-- Only the public API is callable from the browser.
revoke all on all functions in schema qa from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'qa_status()', 'qa_team_login(text,text)', 'qa_admin_login(text,text)', 'qa_logout(uuid)',
    'qa_public_list(text,text,int,int)', 'qa_similar(text,bigint)', 'qa_ask(uuid,text,text[],text,text)',
    'qa_my_questions(uuid)', 'qa_admin_queue(uuid,text)', 'qa_admin_answer(uuid,bigint,text,text,text[],int)',
    'qa_admin_set_hidden(uuid,bigint,boolean)', 'qa_admin_teams(uuid)', 'qa_admin_upsert_team(uuid,text,text,text)',
    'qa_admin_team_active(uuid,text,boolean)', 'qa_admin_set_mode(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- ═══ Team registration (added for Kickoff, 2026-10-26) ═══════════════════════
-- Teams ask to join from /game#registro; the Game Design Team approves them in
-- /game/admin, which creates the team and returns its code once.
create table if not exists qa.registrations (
  id bigint generated always as identity primary key,
  number text not null check (number ~ '^[0-9]{1,6}$'),
  team_name text not null check (char_length(team_name) between 2 and 80),
  city text not null default '' check (char_length(city) <= 80),
  mentor_name text not null check (char_length(mentor_name) between 2 and 80),
  mentor_email text not null check (mentor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(mentor_email) <= 120),
  phone text not null default '' check (char_length(phone) <= 30),
  notes text not null default '' check (char_length(notes) <= 400),
  status text not null default 'new' check (status in ('new', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists registrations_status on qa.registrations (status, created_at desc);
alter table qa.registrations enable row level security;

create or replace function public.qa_register(p_number text, p_team_name text, p_city text, p_mentor_name text, p_mentor_email text, p_phone text default '', p_notes text default '')
returns json language plpgsql security definer set search_path = qa, public as $$
declare n text := trim(coalesce(p_number, ''));
begin
  if n !~ '^[0-9]{1,6}$' then return json_build_object('error', 'NUMBER', 'hint', 'Escribe el número de equipo FIRST (solo dígitos).'); end if;
  if exists (select 1 from qa.teams where number = n and active) then
    return json_build_object('error', 'EXISTS', 'hint', 'Ese equipo ya está registrado. Si perdiste el código, escríbenos.');
  end if;
  if exists (select 1 from qa.registrations where number = n and status = 'new') then
    return json_build_object('ok', true, 'already', true);
  end if;
  if (select count(*) from qa.registrations where created_at > now() - interval '1 hour') >= 40 then
    return json_build_object('error', 'BUSY', 'hint', 'Recibimos muchos registros en este momento. Intenta en unos minutos.');
  end if;
  insert into qa.registrations (number, team_name, city, mentor_name, mentor_email, phone, notes)
  values (n, trim(p_team_name), trim(coalesce(p_city, '')), trim(p_mentor_name), lower(trim(p_mentor_email)),
          trim(coalesce(p_phone, '')), trim(coalesce(p_notes, '')));
  return json_build_object('ok', true);
exception when check_violation then
  return json_build_object('error', 'INVALID', 'hint', 'Revisa los datos: nombre del equipo, mentor y un correo válido son obligatorios.');
end $$;

create or replace function public.qa_admin_registrations(p_token uuid) returns json
language plpgsql stable security definer set search_path = qa, public as $$
begin
  perform qa._admin(p_token);
  return coalesce((select json_agg(row_to_json(r) order by (r.status = 'new') desc, r.created_at desc) from qa.registrations r), '[]'::json);
end $$;

create or replace function public.qa_admin_review(p_token uuid, p_id bigint, p_approve boolean) returns json
language plpgsql security definer set search_path = qa, extensions, public as $$
declare r qa.registrations; res json;
begin
  perform qa._admin(p_token);
  select * into r from qa.registrations where id = p_id;
  if r.id is null then raise exception 'NOT_FOUND'; end if;
  if p_approve then
    res := public.qa_admin_upsert_team(p_token, r.number, r.team_name, null);
    update qa.registrations set status = 'approved', reviewed_at = now() where id = p_id;
    return (res::jsonb || jsonb_build_object('email', r.mentor_email, 'mentor', r.mentor_name, 'team_name', r.team_name))::json;
  end if;
  update qa.registrations set status = 'rejected', reviewed_at = now() where id = p_id;
  return json_build_object('rejected', true);
end $$;

revoke all on function public.qa_register(text,text,text,text,text,text,text) from public;
revoke all on function public.qa_admin_registrations(uuid) from public;
revoke all on function public.qa_admin_review(uuid,bigint,boolean) from public;
grant execute on function public.qa_register(text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.qa_admin_registrations(uuid) to anon, authenticated;
grant execute on function public.qa_admin_review(uuid,bigint,boolean) to anon, authenticated;

-- Manual 1.7: the Q&A opens Friday, October 30, 2026, at 4:15 pm (UTC-6).
update qa.settings set value = '2026-10-30T16:15:00-06:00' where key = 'opens_at';
