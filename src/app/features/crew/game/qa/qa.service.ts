import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase.service';

/**
 * TideChallenge Q&A client. Every call goes through the SECURITY DEFINER
 * functions in supabase/migrations/0002_tidechallenge_qa.sql: the tables
 * themselves are private, so the browser never reads them directly.
 */

export type Section = 'general' | 'juego' | 'robot' | 'campo' | 'torneo';
export type Status = 'pending' | 'answered' | 'declined';

export const SECTIONS: { id: Section; label: string }[] = [
  { id: 'juego', label: 'Juego y puntuación' },
  { id: 'robot', label: 'Robot' },
  { id: 'campo', label: 'Campo y elementos' },
  { id: 'torneo', label: 'Torneo' },
  { id: 'general', label: 'General' },
];
export const sectionLabel = (id: string) => SECTIONS.find((s) => s.id === id)?.label ?? id;

export interface Question {
  id: number;
  number: number | null;
  team: string;
  section: Section;
  rules: string[];
  title: string;
  body: string;
  status: Status;
  answer: string | null;
  answer_rules: string[];
  duplicate_of: number | null;
  created_at: string;
  answered_at: string | null;
  hidden?: boolean;
}

export interface QaStatus { open: boolean; mode: 'auto' | 'open' | 'closed'; opens_at: string; closes_at: string; published: number; }
export interface TeamSession { token: string; number: string; name: string; expires_at: string; }
export interface AdminSession { token: string; username: string; expires_at: string; }
/** Logins return their failures (so attempts get recorded) instead of raising. */
interface LoginError { error?: string; hint?: string; }
export interface TeamRow { number: string; name: string; active: boolean; created_at: string; questions: number; last_login: string | null; }

const TEAM_KEY = 'tc-qa-team';
const ADMIN_KEY = 'tc-qa-admin';

function load<T extends { expires_at: string }>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as T;
    return Date.parse(v.expires_at) > Date.now() ? v : null;
  } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class QaService {
  private readonly sb = inject(SupabaseService).client;

  readonly team = signal<TeamSession | null>(load<TeamSession>(globalThis.localStorage, TEAM_KEY));
  readonly admin = signal<AdminSession | null>(load<AdminSession>(globalThis.sessionStorage, ADMIN_KEY));

  /** Turns a Postgres exception into the friendly hint we raised with it. */
  private async call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.sb.rpc(fn, args);
    if (error) {
      const code = error.message;
      if (code === 'SESSION') { this.dropTeam(); this.dropAdmin(); }
      throw new Error(error.hint || friendly(code));
    }
    return data as T;
  }

  status() { return this.call<QaStatus>('qa_status'); }
  list(search?: string, section?: string) {
    return this.call<Question[]>('qa_public_list', { p_search: search || null, p_section: section || null, p_limit: 200, p_offset: 0 });
  }
  similar(text: string, exclude?: number) { return this.call<Question[]>('qa_similar', { p_text: text, p_exclude: exclude ?? null }); }

  // ── Teams ─────────────────────────────────────────────────────────
  async loginTeam(number: string, code: string) {
    const s = await this.call<TeamSession & LoginError>('qa_team_login', { p_number: number.trim(), p_code: code.trim() });
    if (s.error) throw new Error(s.hint ?? friendly(s.error));
    this.team.set(s);
    try { localStorage.setItem(TEAM_KEY, JSON.stringify(s)); } catch { /* private mode */ }
    return s;
  }
  async logoutTeam() {
    const t = this.team();
    this.dropTeam();
    if (t) await this.sb.rpc('qa_logout', { p_token: t.token });
  }
  private dropTeam() { this.team.set(null); try { localStorage.removeItem(TEAM_KEY); } catch { /* */ } }

  ask(section: Section, rules: string[], title: string, body: string) {
    return this.call<Question>('qa_ask', { p_token: this.team()?.token, p_section: section, p_rules: rules, p_title: title, p_body: body });
  }
  mine() { return this.call<Question[]>('qa_my_questions', { p_token: this.team()?.token }); }

  // ── Admin ─────────────────────────────────────────────────────────
  async loginAdmin(user: string, pass: string) {
    const s = await this.call<AdminSession & LoginError>('qa_admin_login', { p_user: user, p_pass: pass });
    if (s.error) throw new Error(s.hint ?? friendly(s.error));
    this.admin.set(s);
    try { sessionStorage.setItem(ADMIN_KEY, JSON.stringify(s)); } catch { /* */ }
    return s;
  }
  async logoutAdmin() {
    const a = this.admin();
    this.dropAdmin();
    if (a) await this.sb.rpc('qa_logout', { p_token: a.token });
  }
  private dropAdmin() { this.admin.set(null); try { sessionStorage.removeItem(ADMIN_KEY); } catch { /* */ } }

  private get at() { return this.admin()?.token; }
  queue(status?: Status) { return this.call<Question[]>('qa_admin_queue', { p_token: this.at, p_status: status ?? null }); }
  answer(id: number, status: 'answered' | 'declined', answer: string, rules: string[], duplicateOf?: number | null) {
    return this.call<Question>('qa_admin_answer', {
      p_token: this.at, p_id: id, p_status: status, p_answer: answer, p_rules: rules, p_duplicate_of: duplicateOf ?? null,
    });
  }
  setHidden(id: number, hidden: boolean) { return this.call<void>('qa_admin_set_hidden', { p_token: this.at, p_id: id, p_hidden: hidden }); }
  teams() { return this.call<TeamRow[]>('qa_admin_teams', { p_token: this.at }); }
  upsertTeam(number: string, name: string, code?: string) {
    return this.call<{ number: string; code: string }>('qa_admin_upsert_team', { p_token: this.at, p_number: number, p_name: name, p_code: code || null });
  }
  setTeamActive(number: string, active: boolean) { return this.call<void>('qa_admin_team_active', { p_token: this.at, p_number: number, p_active: active }); }
  setMode(mode: 'auto' | 'open' | 'closed') { return this.call<QaStatus>('qa_admin_set_mode', { p_token: this.at, p_mode: mode }); }
}

function friendly(code: string) {
  switch (code) {
    case 'LOGIN': return 'Datos de acceso incorrectos.';
    case 'THROTTLED': return 'Demasiados intentos. Espera 15 minutos.';
    case 'CLOSED': return 'El Q&A está cerrado en este momento.';
    case 'LIMIT': return 'Llegaste al límite de preguntas por ahora.';
    case 'SESSION': return 'Tu sesión expiró. Vuelve a entrar.';
    default: return 'Algo salió mal. Intenta de nuevo.';
  }
}

/** "G101, r-203  G1" → ['G101', 'R-203', 'G1'] */
export function parseRules(text: string): string[] {
  return Array.from(new Set(text.split(/[\s,;]+/).map((r) => r.trim().toUpperCase()).filter(Boolean))).slice(0, 8);
}
