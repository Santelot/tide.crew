import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HubNav } from '../hub-nav';
import { QaCard } from './qa-card';
import { QaService, Question, QaStatus, SECTIONS, Section, parseRules } from './qa.service';

@Component({
  selector: 'app-qa-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HubNav, QaCard],
  templateUrl: './qa-page.html',
  styleUrl: './qa.scss',
})
export class QaPage implements AfterViewInit, OnDestroy {
  protected readonly qa = inject(QaService);
  private readonly route = inject(ActivatedRoute);
  protected readonly sections = SECTIONS;

  protected readonly status = signal<QaStatus | null>(null);
  protected readonly items = signal<Question[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly section = signal<Section | ''>('');
  protected readonly loadError = signal('');

  // Team login
  protected readonly number = signal('');
  protected readonly code = signal('');
  protected readonly loginBusy = signal(false);
  protected readonly loginError = signal('');

  // Ask form
  protected readonly fSection = signal<Section>('juego');
  protected readonly fRules = signal('');
  protected readonly fTitle = signal('');
  protected readonly fBody = signal('');
  protected readonly fChecked = signal(false);
  protected readonly similar = signal<Question[]>([]);
  protected readonly sending = signal(false);
  protected readonly sendError = signal('');
  protected readonly sent = signal<Question | null>(null);
  protected readonly mine = signal<Question[]>([]);

  protected readonly canSend = computed(() =>
    this.fTitle().trim().length >= 8 && this.fBody().trim().length >= 20 && this.fBody().length <= 500 && this.fChecked() && !this.sending());

  private readonly numberInput = viewChild<ElementRef<HTMLInputElement>>('numberInput');
  private searchT = 0;
  private similarT = 0;

  constructor() {
    this.refresh();
    if (this.qa.team()) this.loadMine();
  }

  ngAfterViewInit() {
    if (this.route.snapshot.queryParamMap.get('entrar') && !this.qa.team()) {
      setTimeout(() => this.numberInput()?.nativeElement.focus({ preventScroll: true }), 300);
    }
  }

  ngOnDestroy() { clearTimeout(this.searchT); clearTimeout(this.similarT); }

  protected async refresh() {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const [st, list] = await Promise.all([this.qa.status(), this.qa.list(this.search(), this.section() || undefined)]);
      this.status.set(st);
      this.items.set(list);
    } catch (e) {
      this.loadError.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(v: string) {
    this.search.set(v);
    clearTimeout(this.searchT);
    this.searchT = window.setTimeout(() => this.refresh(), 280);
  }

  protected pickSection(s: Section | '') { this.section.set(s); this.refresh(); }

  /** Clicking a rule chip or a "see Q12" link searches for it. */
  protected lookFor(term: string) {
    this.search.set(term);
    this.refresh();
    document.getElementById('qa-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Team ─────────────────────────────────────────────────────────
  protected async login(ev: Event) {
    ev.preventDefault();
    this.loginBusy.set(true);
    this.loginError.set('');
    try {
      await this.qa.loginTeam(this.number(), this.code());
      this.code.set('');
      await this.loadMine();
    } catch (e) {
      this.loginError.set((e as Error).message);
    } finally {
      this.loginBusy.set(false);
    }
  }

  protected async logout() {
    await this.qa.logoutTeam();
    this.mine.set([]);
    this.sent.set(null);
  }

  private async loadMine() {
    try { this.mine.set(await this.qa.mine()); } catch { /* session gone: the login form shows again */ }
  }

  /** As the team types, look for questions that already cover it. */
  protected typed() {
    clearTimeout(this.similarT);
    const text = (this.fTitle() + ' ' + this.fBody()).trim();
    if (text.length < 8) { this.similar.set([]); return; }
    this.similarT = window.setTimeout(async () => {
      try { this.similar.set(await this.qa.similar(text)); } catch { /* suggestions are best-effort */ }
    }, 350);
  }

  protected async send(ev: Event) {
    ev.preventDefault();
    if (!this.canSend()) return;
    this.sending.set(true);
    this.sendError.set('');
    try {
      const q = await this.qa.ask(this.fSection(), parseRules(this.fRules()), this.fTitle().trim(), this.fBody().trim());
      this.sent.set(q);
      this.fTitle.set(''); this.fBody.set(''); this.fRules.set(''); this.fChecked.set(false); this.similar.set([]);
      await this.loadMine();
    } catch (e) {
      this.sendError.set((e as Error).message);
    } finally {
      this.sending.set(false);
    }
  }

  protected stateText(st: QaStatus) {
    if (st.open) return `Recibimos preguntas hasta el ${this.fmt(st.closes_at)}.`;
    if (st.mode === 'closed') return 'El Game Design Team lo cerró por ahora.';
    return Date.now() < Date.parse(st.opens_at)
      ? `Abre el ${this.fmt(st.opens_at)} y cierra el ${this.fmt(st.closes_at)}.`
      : `Cerró el ${this.fmt(st.closes_at)}.`;
  }

  protected fmt(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' }).format(new Date(iso));
  }
}
