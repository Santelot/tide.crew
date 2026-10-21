import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HubNav } from '../hub-nav';
import { QaCard } from './qa-card';
import { QaService, QaStatus, Question, TeamRow, parseRules, sectionLabel } from './qa.service';

type Tab = 'pending' | 'published' | 'teams' | 'settings';

/** Ready-made answers in the voice FIRST uses for questions the Q&A won't rule on. */
const TEMPLATES = [
  { id: 'hypo', label: 'Hipotética', text: 'El Q&A no responde situaciones hipotéticas ni anticipa decisiones de arbitraje sobre jugadas específicas. En el evento, esas decisiones las toma el árbitro principal con base en el manual.' },
  { id: 'design', label: 'Diseño específico', text: 'El Q&A no evalúa diseños específicos de robot. Revisa las reglas citadas; la legalidad final la determina la inspección durante el evento.' },
  { id: 'scope', label: 'Fuera de alcance', text: 'Esta pregunta está fuera del alcance del Q&A, que solo aclara el manual de TideChallenge. Para otros temas escríbenos a mariana.gomezb@tec.mx.' },
  { id: 'manual', label: 'Ya está en el manual', text: 'La respuesta está en el manual. Revisa la regla citada.' },
];

@Component({
  selector: 'app-qa-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HubNav, QaCard],
  templateUrl: './qa-admin.html',
  styleUrls: ['./qa.scss', './qa-admin.scss'],
})
export class QaAdmin {
  protected readonly qa = inject(QaService);
  protected readonly templates = TEMPLATES;
  protected readonly label = sectionLabel;

  protected readonly user = signal('');
  protected readonly pass = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly tab = signal<Tab>('pending');
  protected readonly all = signal<Question[]>([]);
  protected readonly pending = computed(() => this.all().filter((q) => q.status === 'pending'));
  protected readonly published = computed(() => this.all().filter((q) => q.status !== 'pending'));
  protected readonly selId = signal<number | null>(null);
  protected readonly sel = computed(() => this.all().find((q) => q.id === this.selId()) ?? null);
  protected readonly similar = signal<Question[]>([]);

  // Answer editor
  protected readonly aText = signal('');
  protected readonly aRules = signal('');
  protected readonly aDup = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly flash = signal('');

  // Teams
  protected readonly teams = signal<TeamRow[]>([]);
  protected readonly tNumber = signal('');
  protected readonly tName = signal('');
  protected readonly tCode = signal('');
  protected readonly issued = signal<{ number: string; code: string } | null>(null);

  protected readonly status = signal<QaStatus | null>(null);

  constructor() {
    if (this.qa.admin()) this.loadAll();
  }

  protected async login(ev: Event) {
    ev.preventDefault();
    this.busy.set(true); this.error.set('');
    try {
      await this.qa.loginAdmin(this.user(), this.pass());
      this.pass.set('');
      await this.loadAll();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }

  protected async logout() { await this.qa.logoutAdmin(); this.all.set([]); }

  private async loadAll() {
    try {
      const [qs, teams, st] = await Promise.all([this.qa.queue(), this.qa.teams(), this.qa.status()]);
      this.all.set(qs); this.teams.set(teams); this.status.set(st);
      const first = this.pending()[0];
      if (first && this.selId() === null) this.select(first);
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected async select(q: Question) {
    this.selId.set(q.id);
    this.aText.set(q.answer ?? '');
    this.aRules.set((q.answer_rules.length ? q.answer_rules : q.rules).join(', '));
    this.aDup.set(q.duplicate_of);
    this.flash.set('');
    this.similar.set([]);
    try { this.similar.set((await this.qa.similar(q.title + ' ' + q.body, q.id)).filter((s) => s.status !== 'pending')); } catch { /* optional */ }
  }

  protected useTemplate(text: string) { this.aText.set(text); this.aDup.set(null); }
  protected markDuplicate(n: number) {
    this.aDup.set(n);
    this.aText.set(`Esta pregunta ya fue respondida en Q${n}.`);
  }

  protected async publish(status: 'answered' | 'declined') {
    const q = this.sel(); if (!q) return;
    this.saving.set(true); this.flash.set('');
    try {
      const saved = await this.qa.answer(q.id, status, this.aText(), parseRules(this.aRules()), this.aDup());
      this.all.update((list) => list.map((x) => (x.id === saved.id ? { ...x, ...saved } : x)));
      this.flash.set(`Publicada como Q${saved.number}.`);
      const next = this.pending()[0];
      if (next && this.tab() === 'pending') setTimeout(() => this.select(next), 900);
    } catch (e) { this.flash.set((e as Error).message); }
    finally { this.saving.set(false); }
  }

  protected async toggleHidden(q: Question) {
    await this.qa.setHidden(q.id, !q.hidden);
    this.all.update((list) => list.map((x) => (x.id === q.id ? { ...x, hidden: !q.hidden } : x)));
  }

  // ── Teams ─────────────────────────────────────────────────────────
  protected async addTeam(ev: Event) {
    ev.preventDefault();
    this.error.set('');
    try {
      const r = await this.qa.upsertTeam(this.tNumber().trim(), this.tName().trim(), this.tCode().trim() || undefined);
      this.issued.set(r);
      this.tNumber.set(''); this.tName.set(''); this.tCode.set('');
      this.teams.set(await this.qa.teams());
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected async newCode(t: TeamRow) {
    if (!confirm(`¿Generar un código nuevo para el equipo ${t.number}? El código anterior dejará de funcionar.`)) return;
    const r = await this.qa.upsertTeam(t.number, t.name);
    this.issued.set(r);
  }

  protected async toggleTeam(t: TeamRow) {
    await this.qa.setTeamActive(t.number, !t.active);
    this.teams.set(await this.qa.teams());
  }

  protected copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined); }

  protected async setMode(mode: 'auto' | 'open' | 'closed') {
    this.status.set(await this.qa.setMode(mode));
  }

  protected fmt(iso: string | null) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }).format(new Date(iso));
  }
}
