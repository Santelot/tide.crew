import {
  ChangeDetectionStrategy, Component, DestroyRef, NgZone, OnInit, computed, inject, input, output, signal,
} from '@angular/core';
import { MotionService } from '../../../shared/motion/motion.service';

type Phase = 'idle' | 'count' | 'wave' | 'reveal' | 'leave' | 'gone';

const COUNT_MS = 10_500;   // the overlay takes over 10 s before Kickoff
const WAVE_MS = 1_150;     // the wave sweeping the screen
const HOLD_MS = 11_000;    // how long the reveal stays before it recedes on its own
const LEAVE_MS = 950;
const LATE_MS = 20_000;    // came back to the tab more than this after Kickoff → skip the show

/** Bubbles and scoops, laid out once so they don't jump between renders. */
const rnd = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const BUBBLES = Array.from({ length: 26 }, (_, i) => ({
  x: rnd(i + 1) * 100, s: 6 + rnd(i + 40) * 22, d: 3.2 + rnd(i + 80) * 3.6, delay: rnd(i + 120) * 2.4,
}));
const SCOOPS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + rnd(i + 7) * 0.4;
  const r = 34 + rnd(i + 11) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.75, s: 10 + rnd(i + 3) * 18, c: ['#0A1FD1', '#E8232A', '#FFE9D6', '#00CFE6'][i % 4], d: rnd(i + 5) * 0.25 };
});

/**
 * The Kickoff moment for people who are waiting on /game: the last ten seconds take
 * over the screen while the water rises, a wave sweeps everything and the game's logo
 * surfaces. Click, Esc or the buttons send it away; it also recedes on its own.
 */
@Component({
  selector: 'tc-kickoff',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'dismiss()' },
  template: `
    @if (phase() !== 'idle' && phase() !== 'gone') {
      <div class="ko" [attr.data-phase]="phase()" role="dialog" aria-modal="true" aria-label="Kickoff de TideChallenge"
           [style.--w]="water()" (click)="onBackdrop($event)">

        <!-- countdown -->
        <div class="ko__count" aria-hidden="true">
          <p class="ko__k">TideChallenge · Kickoff {{ year }}</p>
          @for (k of [n()]; track k) { <span class="ko__n">{{ k }}</span> }
          <p class="ko__sub">El juego está por salir a la superficie</p>
        </div>

        <!-- water rising from the bottom -->
        <div class="ko__water" aria-hidden="true">
          <svg class="ko__crest" viewBox="0 0 1200 60" preserveAspectRatio="none">
            <path d="M0 30 Q 75 0 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30 V 60 H 0 Z" />
          </svg>
        </div>

        <!-- the wave that sweeps the screen at zero -->
        <div class="ko__wave" aria-hidden="true">
          <svg class="ko__wave-top" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path class="f" d="M0 70 Q 100 10 200 60 T 400 55 T 600 62 T 800 50 T 1000 64 T 1200 52 V 120 H 0 Z" />
            <path d="M0 90 Q 100 40 200 84 T 400 80 T 600 86 T 800 76 T 1000 88 T 1200 78 V 120 H 0 Z" />
          </svg>
          <div class="ko__wave-body"></div>
        </div>

        <!-- reveal -->
        <div class="ko__reveal">
          <div class="ko__bubbles" aria-hidden="true">
            @for (b of bubbles; track $index) {
              <i [style.left.%]="b.x" [style.width.px]="b.s" [style.height.px]="b.s"
                 [style.animation-duration.s]="b.d" [style.animation-delay.s]="b.delay"></i>
            }
          </div>
          <p class="ko__k ko__k--r">TideChallenge · Offseason {{ year }}</p>
          <div class="ko__logo">
            <div class="ko__burst" aria-hidden="true">
              @for (s of scoops; track $index) {
                <i [style.--x.vmin]="s.x" [style.--y.vmin]="s.y" [style.width.px]="s.s" [style.height.px]="s.s"
                   [style.background]="s.c" [style.animation-delay.s]="0.55 + s.d"></i>
              }
            </div>
            <img src="/brand/frozen-blitz.webp" alt="FROZEN BLITZ" width="900" height="539" />
          </div>
          <p class="ko__line" aria-live="polite">El juego de la temporada ya está aquí.</p>
          <div class="ko__act">
            <a class="ko__btn ko__btn--solid" [href]="manualHref()" target="_blank" rel="noopener">Abrir el manual</a>
            <button type="button" class="ko__btn" (click)="seeAll()">Ver todos los materiales</button>
          </div>
          <button type="button" class="ko__x" (click)="dismiss()" aria-label="Cerrar">Cerrar <span aria-hidden="true">✕</span></button>
        </div>
      </div>
    }
  `,
  styleUrl: './kickoff.scss',
})
export class Kickoff implements OnInit {
  /** Kickoff instant (ms since epoch, real clock). */
  readonly at = input.required<number>();
  /** Shift applied to Date.now() — used by the rehearsal mode. */
  readonly offset = input(0);
  readonly manualHref = input('');
  /** Fired when the overlay is gone; `true` if the visitor asked to see the materials. */
  readonly done = output<boolean>();

  private readonly zone = inject(NgZone);
  private readonly motion = inject(MotionService);
  protected readonly phase = signal<Phase>('idle');
  protected readonly n = signal(10);
  protected readonly water = signal(0);
  protected readonly bubbles = BUBBLES;
  protected readonly scoops = SCOOPS;
  protected readonly year = new Date().getFullYear();
  private readonly busy = computed(() => this.phase() !== 'idle' && this.phase() !== 'gone');

  private raf = 0;
  private zeroAt = 0;
  private wantsDocs = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => { cancelAnimationFrame(this.raf); this.motion.lock(false); });
  }

  ngOnInit() {
    this.zone.runOutsideAngular(() => { this.raf = requestAnimationFrame(() => this.tick()); });
  }

  private tick() {
    const t = Date.now() + this.offset();
    const rem = this.at() - t;
    const p = this.phase();

    if (p === 'idle') {
      if (rem <= 0 && -rem > LATE_MS) { this.end(); return; }
      if (rem <= 0) { this.zeroAt = performance.now(); this.set('wave'); }
      else if (rem <= COUNT_MS) this.set('count');
    }
    if (this.phase() === 'count') {
      this.n.set(Math.min(10, Math.max(1, Math.ceil(rem / 1000))));
      this.water.set(Math.min(1, Math.max(0, 1 - rem / COUNT_MS)));
      if (rem <= 0) { this.zeroAt = performance.now(); this.set(this.motion.reduced ? 'reveal' : 'wave'); }
    }
    const since = performance.now() - this.zeroAt;
    if (this.phase() === 'wave' && since >= WAVE_MS) this.set('reveal');
    if (this.phase() === 'reveal' && since >= WAVE_MS + HOLD_MS) this.leave();
    if (this.phase() === 'gone') return;
    this.raf = requestAnimationFrame(() => this.tick());
  }

  private set(p: Phase) {
    if (this.phase() === p) return;
    this.phase.set(p);
    this.motion.lock(this.busy());
  }

  protected onBackdrop(ev: MouseEvent) {
    // Only the reveal can be dismissed by clicking around; the countdown is the show.
    if (this.phase() === 'reveal' && ev.target === ev.currentTarget) this.dismiss();
  }

  protected seeAll() { this.wantsDocs = true; this.leave(); }

  dismiss() {
    const p = this.phase();
    if (p === 'reveal' || p === 'count' || p === 'wave') this.leave();
  }

  private leave() {
    if (this.phase() === 'leave' || this.phase() === 'gone') return;
    this.set('leave');
    setTimeout(() => this.end(), this.motion.reduced ? 200 : LEAVE_MS);
  }

  private end() {
    cancelAnimationFrame(this.raf);
    this.set('gone');
    this.motion.lock(false);
    this.done.emit(this.wantsDocs);
  }
}
