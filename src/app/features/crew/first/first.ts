import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy,
  computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../../core/lang.service';
import { Mark } from '../../../shared/mark/mark';
import { IntroService } from '../../../shared/motion/intro.service';
import { MotionService, ScrollTrigger, gsap } from '../../../shared/motion/motion.service';
import { SectionService } from '../../../shared/motion/section.service';
import { WaterGl } from '../../../shared/water/water-gl';
import { Ocean } from '../../../shared/ocean/ocean';
import { TideSound } from '../../../shared/ocean/tide-sound.service';
import { Wake } from '../../../shared/wake/wake';
import {
  COACHES, CONTACT_EMAIL, COPY, LADDER, MILESTONES, SEASONS, SOCIAL, TEAMS, Team,
} from '../landing.content';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

@Component({
  selector: 'app-first',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, WaterGl, Ocean, Mark, Wake],
  templateUrl: './first.html',
  styleUrl: './first.scss',
})
export class First implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly langSvc = inject(LangService);
  private readonly intro = inject(IntroService);
  protected readonly motion = inject(MotionService);
  protected readonly sections = inject(SectionService);
  private readonly sound = inject(TideSound);

  // ── Content ─────────────────────────────────────────────────────
  protected readonly lang = this.langSvc.lang;
  protected readonly c = computed(() => COPY[this.lang()]);
  protected readonly words = computed(() => this.c().about.statement.split(' '));
  protected readonly teams = TEAMS;
  protected readonly ladder = LADDER;
  protected readonly seasons = SEASONS;
  protected readonly coaches = COACHES;
  protected readonly social = SOCIAL;
  protected readonly email = CONTACT_EMAIL;
  protected readonly bubbles = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 41 + 7) % 100, r: 4 + ((i * 5) % 13), d: 7 + ((i * 3) % 7), delay: (i * 0.7) % 6,
  }));

  protected readonly rail = computed(() => {
    const n = this.c().nav;
    return [
      { id: 'tidecrew', label: n.tidecrew }, { id: 'first', label: n.first }, { id: 'equipos', label: n.teams },
      { id: 'trayectoria', label: n.history }, { id: 'impacto', label: n.impact },
      { id: 'tidechallenge', label: n.challenge }, { id: 'unete', label: n.join },
    ];
  });

  // ── State ───────────────────────────────────────────────────────
  protected readonly entered = signal(false);
  protected readonly sel = signal(0);
  protected readonly aud = signal(0);
  protected readonly hotLevel = signal(-1);
  protected readonly activeSeason = signal(0);
  protected readonly copied = signal(false);
  protected readonly railOn = signal(false);
  protected readonly railTone = signal<'ink' | 'foam'>('foam');
  protected readonly depth = signal(0);
  protected readonly indX = signal(0);
  protected readonly indW = signal(0);
  private readonly now = signal(Date.now());

  protected readonly cur = computed(() => TEAMS[this.sel()]);
  protected readonly detail = computed(() => this.c().teams.detail[this.cur().id]);
  protected readonly audTab = computed(() => this.c().join.tabs[this.aud()]);

  protected readonly milestones = computed(() => {
    const now = this.now();
    let nextSet = false;
    return MILESTONES.map((m) => {
      const t = Date.parse(m.at);
      let state: 'done' | 'next' | 'later' = 'later';
      if (t <= now) state = 'done';
      else if (!nextSet) { state = 'next'; nextSet = true; }
      return { ...m, t, state };
    });
  });
  protected readonly nextMilestone = computed(() => this.milestones().find((m) => m.state === 'next'));
  protected readonly countdown = computed(() => {
    const m = this.nextMilestone();
    if (!m) return [];
    const s = Math.max(0, Math.floor((m.t - this.now()) / 1000));
    return [pad(Math.floor(s / 86400)), pad(Math.floor(s / 3600) % 24), pad(Math.floor(s / 60) % 60), pad(s % 60)];
  });

  // ── Elements ────────────────────────────────────────────────────
  private readonly water = viewChild.required(WaterGl);
  private readonly ocean = viewChild.required(Ocean);
  private readonly heroEl = viewChild.required<ElementRef<HTMLElement>>('hero');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly copyEl = viewChild.required<ElementRef<HTMLElement>>('copy');
  private readonly markWrap = viewChild.required<ElementRef<HTMLElement>>('markWrap');
  private readonly shadow = viewChild.required<ElementRef<HTMLElement>>('shadow');
  private readonly cue = viewChild.required<ElementRef<HTMLElement>>('cue');
  private readonly statement = viewChild.required<ElementRef<HTMLElement>>('statement');
  private readonly ladderEl = viewChild.required<ElementRef<HTMLElement>>('ladderList');
  private readonly panelWater = viewChild.required<ElementRef<HTMLElement>>('panelWater');
  private readonly panelLogo = viewChild.required<ElementRef<HTMLElement>>('panelLogo');
  private readonly panelInfo = viewChild.required<ElementRef<HTMLElement>>('panelInfo');
  private readonly tl = viewChild.required<ElementRef<HTMLElement>>('tl');
  private readonly tlFill = viewChild.required<ElementRef<HTMLElement>>('tlFill');
  private readonly challenge = viewChild.required<ElementRef<HTMLElement>>('challenge');
  private readonly challengeName = viewChild.required<ElementRef<HTMLElement>>('challengeName');
  private readonly audTabs = viewChild.required<ElementRef<HTMLElement>>('audTabs');

  private ctx?: gsap.Context;
  private storyCtx?: gsap.Context;
  private heroP = 0;
  private tide = { level: 0, shadow: 0 };
  private lastDrop = 0;
  private lastTouch = 0;
  private t0 = performance.now();
  private ready = false;
  private switching = false;
  private clock = 0;
  private copiedT = 0;
  private frame = () => this.composeHero();
  private onResize = () => this.measureInd();

  constructor() {
    effect(() => { if (this.intro.cleared() && this.ready) this.enter(); });
    // Back at the surface after the ascent: the water splashes under the mark.
    effect(() => { if (this.sections.surfaced() > 0) setTimeout(() => this.splash(), 0); });
    // The statement is re-split per language, so its scroll fill is rebuilt after re-render.
    effect(() => {
      this.words();
      if (this.ready) setTimeout(() => { this.buildStory(); ScrollTrigger.refresh(); }, 0);
    });
    // Keep the audience indicator under the selected tab (labels change width per language).
    effect(() => { this.aud(); this.lang(); requestAnimationFrame(() => this.measureInd()); });
  }

  ngAfterViewInit() {
    const root: HTMLElement = this.host.nativeElement;
    const sec = (id: string) => root.querySelector<HTMLElement>('#' + id)!;
    const ocean = this.ocean();
    ocean.setBands([
      { el: sec('tidecrew'), surface: false, palette: 0 },
      { el: sec('impacto'), surface: true, palette: 1 },
      { el: sec('tidechallenge'), surface: false, palette: 2 },
    ]);
    // Water sections keep their painted colour until the live ocean is actually running.
    if (ocean.ready) root.classList.add('ocean-on');
    ocean.onSplash = (d) => this.sound.bloop(d);
    this.zone.runOutsideAngular(() => {
      root.addEventListener('pointermove', this.magnet, { passive: true });
      root.addEventListener('pointerout', this.unmagnet, { passive: true });
      this.ctx = gsap.context(() => this.build(), this.host.nativeElement);
      this.buildStory();
      gsap.ticker.add(this.frame);
      ((document as any).fonts?.ready ?? Promise.resolve()).then(() => { ScrollTrigger.refresh(); this.measureInd(); });
      addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      addEventListener('resize', this.onResize, { passive: true });
      this.clock = window.setInterval(() => this.now.set(Date.now()), 1000);
    });
    this.ready = true;
    this.measureInd();
    if (this.intro.cleared()) this.enter();
  }

  ngOnDestroy() {
    gsap.ticker.remove(this.frame);
    clearInterval(this.clock);
    clearTimeout(this.copiedT);
    removeEventListener('resize', this.onResize);
    const root: HTMLElement = this.host.nativeElement;
    root.removeEventListener('pointermove', this.magnet);
    root.removeEventListener('pointerout', this.unmagnet);
    this.storyCtx?.revert();
    this.ctx?.revert();
    this.sections.active.set('');
  }

  // ── Helpers for the template ────────────────────────────────────
  protected team(id: Team['id']) { return TEAMS.find((t) => t.id === id)!; }
  protected initials(name: string) { return name.split(' ').slice(0, 2).map((w) => w[0]).join(''); }
  protected dotColor(id: Team['id'] | 'crew') { return id === 'crew' ? '#00A6B8' : this.team(id).color; }
  protected mailto(subject: string) {
    return 'mailto:' + this.email + (subject ? '?subject=' + encodeURIComponent(subject) : '');
  }
  protected fmtDate(iso: string) {
    return new Intl.DateTimeFormat(this.lang() === 'es' ? 'es-MX' : 'en-US', {
      day: 'numeric', month: 'short', timeZone: 'America/Mexico_City',
    }).format(new Date(iso)).replace('.', '');
  }

  // ── Interactions ────────────────────────────────────────────────
  protected onPointer(ev: PointerEvent, strong = false) {
    const now = performance.now();
    if (!strong && now - this.lastTouch < 70) return;
    this.lastTouch = now;
    this.water().touch(ev.clientX, ev.clientY, strong ? 1.5 : 0.55);
    this.nudge(ev.clientX, ev.clientY, strong ? 1 : 0.18);
    if (strong) this.sound.bloop(0.1);
  }

  /**
   * The mark is a buoy: water pushed near it shoves it down and tips it away,
   * and a spring brings it back bobbing. Strength 1 ≈ a tap right beside it.
   */
  private buoy = { y: 0, vy: 0, a: 0, va: 0, last: 0 };
  private nudge(clientX: number, clientY: number, strength: number) {
    if (this.motion.reduced) return;
    const r = this.markWrap().nativeElement.getBoundingClientRect();
    if (!r.width) return;
    const dx = (clientX - (r.left + r.width / 2)) / r.width;
    const dy = (clientY - (r.top + r.height * 0.86)) / r.height;
    const reach = Math.exp(-(dx * dx) * 1.4) * Math.exp(-Math.max(0, Math.abs(dy) - 0.2) * 2.2);
    if (reach < 0.02) return;
    this.buoy.vy += strength * reach * r.height * 0.9;
    this.buoy.va += -Math.sign(dx || 1) * strength * reach * 38;
  }

  /** Arriving back at the surface: a splash right under the mark. */
  private splash() {
    const r = this.markWrap().nativeElement.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.9;
    this.water().touch(x, y, 2.4);
    this.nudge(x, y, 2.2);
    this.sound.bloop(0);
  }

  /** Buttons lean toward the pointer, just a little, like something floating. */
  private magnet = (ev: PointerEvent) => {
    if (ev.pointerType !== 'mouse' || this.motion.reduced) return;
    const btn = (ev.target as Element | null)?.closest?.('.btn') as HTMLElement | null;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const x = (ev.clientX - r.left - r.width / 2) / r.width;
    const y = (ev.clientY - r.top - r.height / 2) / r.height;
    gsap.to(btn, { x: x * 10, y: y * 8, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
  };

  private unmagnet = (ev: PointerEvent) => {
    const btn = (ev.target as Element | null)?.closest?.('.btn') as HTMLElement | null;
    if (!btn || btn.contains(ev.relatedTarget as Node)) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  };

  protected jump(ev: Event, id: string) {
    ev.preventDefault();
    this.motion.scrollTo('#' + id, -10);
  }

  protected openTeam(ev: Event, id: Team['id']) {
    ev.preventDefault();
    this.pick(TEAMS.findIndex((t) => t.id === id), true);
    this.motion.scrollTo('#equipos', -10);
  }

  /** Switch the team panel: the water drains, changes colour, and floods back in. */
  protected pick = (i: number, instant = false) => {
    if (i === this.sel() || i < 0) return;
    if (this.motion.reduced || instant) { this.sel.set(i); return; }
    if (this.switching) return;
    this.switching = true;
    const water = this.panelWater().nativeElement;
    const logo = this.panelLogo().nativeElement;
    const info = this.panelInfo().nativeElement;
    gsap.timeline({ onComplete: () => (this.switching = false) })
      .to(water, { yPercent: 105, duration: 0.42, ease: 'power3.in' }, 0)
      .to(logo, { y: 70, rotate: -10, opacity: 0, duration: 0.38, ease: 'power3.in' }, 0)
      .to(info, { opacity: 0, y: 14, duration: 0.25, ease: 'power2.in' }, 0)
      .add(() => this.sel.set(i))
      .to(water, { yPercent: 0, duration: 1, ease: 'expo.out' }, '+=0.06')
      .fromTo(logo, { y: 90, rotate: 12, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(1.5)' }, '<0.08')
      .fromTo(info.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 }, '<0.05')
      .set(info, { opacity: 1, y: 0 }, '<');
  };

  protected pickAud = (i: number) => this.aud.set(i);

  /** Arrow keys move between tabs, as screen-reader users expect. */
  protected tabKeys(ev: KeyboardEvent, current: number, n: number, fn: (i: number) => void) {
    const k = ev.key;
    let next = current;
    if (k === 'ArrowRight' || k === 'ArrowDown') next = (current + 1) % n;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') next = (current - 1 + n) % n;
    else if (k === 'Home') next = 0;
    else if (k === 'End') next = n - 1;
    else return;
    ev.preventDefault();
    fn(next);
    const tabs = (ev.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[next]?.focus();
  }

  protected ripple(ev: PointerEvent) {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${ev.clientX - r.left}px`);
    el.style.setProperty('--y', `${ev.clientY - r.top}px`);
  }

  protected async copyEmail() {
    try {
      await navigator.clipboard.writeText(this.email);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = this.email;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nothing else to try */ }
      ta.remove();
    }
    this.copied.set(true);
    clearTimeout(this.copiedT);
    this.copiedT = window.setTimeout(() => this.copied.set(false), 1800);
  }

  private measureInd() {
    const wrap = this.audTabs()?.nativeElement;
    const tab = wrap?.querySelectorAll<HTMLElement>('[role="tab"]')[this.aud()];
    if (!tab) return;
    this.indX.set(tab.offsetLeft);
    this.indW.set(tab.offsetWidth);
  }

  // ── Hero ────────────────────────────────────────────────────────
  private entering = false;
  private enter() {
    if (this.entering) return;
    this.entering = true;
    const root: HTMLElement = this.host.nativeElement;
    this.entered.set(true);
    const target = innerWidth < 760 ? 0.19 : 0.24;
    if (this.motion.reduced) { this.tide.level = target; this.tide.shadow = 1; return; }
    const mark = this.markWrap().nativeElement;
    gsap.timeline()
      .to(this.tide, { level: target, duration: 1.8, ease: 'power3.out' }, 0)
      .from(root.querySelectorAll('[data-word]'), { yPercent: 115, rotate: 6, duration: 1.1, ease: 'expo.out', stagger: 0.09 }, 0.15)
      .from(root.querySelectorAll('.hero__copy [data-in]'), { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.55)
      .from(mark.querySelectorAll('.m-piece'), {
        scale: 0.4, opacity: 0, rotation: -35, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.06,
        onStart: () => {
          const r = mark.getBoundingClientRect();
          setTimeout(() => this.water().touch(r.left + r.width / 2, r.bottom - r.height * 0.12, 2.2), 380);
        },
      }, 0.75)
      .to(this.tide, { shadow: 1, duration: 1.4, ease: 'power2.out' }, 1.25)
      .from(this.cue().nativeElement, { opacity: 0, y: 10, duration: 0.8 }, 1.3);
  }

  /** Every frame: water level, the mark riding it, and the mark's shadow in the water. */
  private composeHero() {
    const stageEl = this.stage().nativeElement;
    const H = stageEl.clientHeight, W = stageEl.clientWidth;
    if (!H) return;
    const water = this.water();
    const p = this.heroP;
    const fill = ease(clamp((p - 0.05) / 0.85));
    const level = this.tide.level + (1.12 - this.tide.level) * fill;
    water.setLevel(level);

    const t = (performance.now() - this.t0) / 1000 * 0.75;
    const narrow = W < 760;

    // The mark rides the surface, tilting with the swell.
    const mw = this.markWrap().nativeElement;
    const mx = narrow ? 0.5 : 0.76;
    const sy = water.surfacePx(mx);
    const slope = water.surfacePx(mx + 0.03) - water.surfacePx(mx - 0.03);
    const tilt = clamp(slope * 0.35, -6, 6);
    const mh = mw.offsetHeight;
    // Buoy physics: damped springs on depth and tilt.
    const b = this.buoy;
    const now = performance.now();
    const dt = Math.min(0.05, b.last ? (now - b.last) / 1000 : 0.016);
    b.last = now;
    b.vy += (-34 * b.y - 3.6 * b.vy) * dt;  b.y += b.vy * dt;
    b.va += (-26 * b.a - 3.2 * b.va) * dt;  b.a += b.va * dt;
    b.y = clamp(b.y, -mh * 0.35, mh * 0.35); b.a = clamp(b.a, -22, 22);
    mw.style.transform = `translate3d(0, ${sy - mh * 0.86 + b.y}px, 0) rotate(${tilt + b.a}deg)`;

    // Its shadow: a flattened, blurred silhouette just under the surface, drifting with the swell.
    const sh = this.shadow().nativeElement;
    const sway = Math.sin(t * 0.8) * mh * 0.015;
    sh.style.transform =
      `translate3d(${mh * 0.12 + sway}px, ${sy + mh * 0.07 - mh / 2}px, 0) ` +
      `rotate(${tilt * 0.6}deg) skewX(-34deg) scale(${1.02 + Math.sin(t * 1.1) * 0.025}, 0.24)`;
    sh.style.opacity = String(clamp(1 - fill * 1.6) * 0.34 * this.tide.shadow);

    // Copy lifts away as the water climbs.
    const cp = this.copyEl().nativeElement;
    const out = clamp((p - 0.12) / 0.38);
    cp.style.transform = `translate3d(0, ${-out * H * 0.22}px, 0)`;
    cp.style.opacity = String(1 - out);
    this.cue().nativeElement.style.opacity = String(clamp(1 - p * 14));

    const tone = level > 0.97 ? 'pacific' : 'light';
    const hero = this.heroEl().nativeElement;
    if (hero.dataset['tone'] !== tone) hero.dataset['tone'] = tone;

    // A raindrop now and then, so the water reads as touchable.
    const depthPx = H - sy;
    if (!this.motion.reduced && t - this.lastDrop > 2.4 && p < 0.5) {
      this.lastDrop = t;
      const r = stageEl.getBoundingClientRect();
      const dx = r.left + W * (0.1 + Math.random() * 0.8), dy = r.top + sy + 20 + Math.random() * Math.max(10, depthPx - 40);
      water.touch(dx, dy, 0.7);
      this.nudge(dx, dy, 0.35);
    }
  }

  // ── Scroll choreography (no pinning: the page always scrolls freely) ──
  private build() {
    const reduced = this.motion.reduced;
    const root: HTMLElement = this.host.nativeElement;

    ScrollTrigger.create({
      trigger: this.heroEl().nativeElement, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => (this.heroP = reduced ? 0 : s.progress),
      onToggle: (s) => { if (s.isActive) this.sections.active.set(''); },
    });

    // Section spy for the rail and the top nav.
    gsap.utils.toArray<HTMLElement>('[data-section]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (s) => { if (s.isActive) this.sections.active.set(sec.id); },
      });
    });

    // Depth gauge + rail visibility + rail ink that reads on whatever is beneath it.
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => {
        this.depth.set(Math.round(s.progress * 120));
        this.railOn.set(scrollY > innerHeight * 0.95);
        const hit = document.elementsFromPoint(innerWidth - 24, innerHeight / 2)
          .map((e) => (e as HTMLElement).closest?.('[data-tone]') as HTMLElement | null).find(Boolean);
        this.railTone.set(hit?.dataset['tone'] === 'light' ? 'ink' : 'foam');
      },
    });

    // "Más que ___": the word gets struck through as it arrives.
    gsap.utils.toArray<HTMLElement>('[data-more]').forEach((el) => {
      if (reduced) { el.classList.add('is-in'); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => el.classList.add('is-in') });
    });

    if (!reduced) {
      // One reveal language: titles rise out of a mask, everything else floats up and settles.
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        const st = { trigger: el, start: 'top 90%', once: true };
        if (el.classList.contains('title') || el.classList.contains('subtitle')) {
          gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)', y: 48 }, {
            clipPath: 'inset(0% 0% -12% 0%)', y: 0, duration: 1.25, ease: 'expo.out', scrollTrigger: st,
            onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
          });
        } else {
          gsap.from(el, { y: 32, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: st });
        }
      });
      gsap.utils.toArray<HTMLElement>('.stat__v[data-to]').forEach((el) => {
        const to = Number(el.dataset['to'] ?? 0);
        const o = { v: 0 };
        gsap.to(o, {
          v: to, duration: 1.6, ease: 'power2.out',
          onUpdate: () => (el.textContent = String(Math.round(o.v))),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      // Wave paths repeat exactly every half width, so shifting by -50% loops without a seam.
      gsap.to('.surface__front', { xPercent: -50, duration: 12, ease: 'none', repeat: -1 });
      gsap.fromTo('.surface__back', { xPercent: -50 }, { xPercent: 0, duration: 20, ease: 'none', repeat: -1 });
    }

    const award = root.querySelector<HTMLElement>('.award');
    if (award) {
      if (reduced) award.classList.add('is-lit');
      else ScrollTrigger.create({ trigger: award, start: 'top 70%', once: true, onEnter: () => award.classList.add('is-lit') });
    }

    // The FIRST ladder fills shore → deep.
    const ladder = this.ladderEl().nativeElement;
    if (reduced) ladder.classList.add('is-in');
    else ScrollTrigger.create({ trigger: ladder, start: 'top 75%', once: true, onEnter: () => ladder.classList.add('is-in') });

    // Timeline: the tide line fills as you read; the big year follows along.
    const list = this.tl().nativeElement.querySelector('.tl__main') as HTMLElement;
    if (!reduced) {
      gsap.fromTo(this.tlFill().nativeElement, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
      });
    }
    root.querySelectorAll<HTMLElement>('[data-season]').forEach((el) => {
      const i = Number(el.dataset['i']);
      ScrollTrigger.create({
        trigger: el, start: 'top 62%',
        onEnter: () => this.activeSeason.set(i),
        onLeaveBack: () => this.activeSeason.set(Math.max(0, i - 1)),
      });
    });

    if (!reduced) {
      // TideChallenge runs as an endless marquee; scrolling pushes it faster, in the scroll's direction.
      const loop = gsap.to(this.challengeName().nativeElement, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        trigger: this.challenge().nativeElement, start: 'top bottom', end: 'bottom top',
        onUpdate: (st) => {
          const v = clamp(st.getVelocity() / 300, -8, 8);
          gsap.to(loop, { timeScale: v >= 0 ? 1 + v : Math.min(-1, v), duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.3, ease: 'power2.out' });
        },
      });
    }
  }

  /** The statement fills in word by word as you read it. */
  private buildStory() {
    this.storyCtx?.revert();
    if (this.motion.reduced) return;
    this.zone.runOutsideAngular(() => {
      this.storyCtx = gsap.context(() => {
        const el = this.statement().nativeElement;
        gsap.fromTo(el.querySelectorAll('.sw'), { opacity: 0.2 }, {
          opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
        });
      }, this.host.nativeElement);
    });
  }
}
