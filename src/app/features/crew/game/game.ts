import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, computed, inject, signal, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ocean } from '../../../shared/ocean/ocean';
import { Mark } from '../../../shared/mark/mark';
import { MotionService, ScrollTrigger, gsap } from '../../../shared/motion/motion.service';
import { MILESTONES } from '../landing.content';
import { CHALLENGE, MILESTONE_LABELS, Material, SECTIONS } from './game.content';

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

@Component({
  selector: 'app-game',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Ocean, Mark],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly motion = inject(MotionService);

  protected readonly c = CHALLENGE;
  protected readonly sections = SECTIONS;
  protected readonly labels = MILESTONE_LABELS;
  protected readonly active = signal(SECTIONS[0]?.id ?? '');
  private readonly now = signal(Date.now());

  protected readonly items = SECTIONS.flatMap((s) => s.items);
  protected readonly published = this.items.filter((i) => !!i.href).length;
  protected readonly total = this.items.length;

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
  protected readonly next = computed(() => this.milestones().find((m) => m.state === 'next'));
  protected readonly countdown = computed(() => {
    const m = this.next();
    if (!m) return [];
    const s = Math.max(0, Math.floor((m.t - this.now()) / 1000));
    return [pad(Math.floor(s / 86400)), pad(Math.floor(s / 3600) % 24), pad(Math.floor(s / 60) % 60), pad(s % 60)];
  });
  /** How far along the season is, 0 → 1, from manual release to challenge day. */
  protected readonly progress = computed(() => {
    const ms = this.milestones();
    const a = ms[0].t, b = ms[ms.length - 1].t;
    return Math.min(1, Math.max(0, (this.now() - a) / (b - a)));
  });
  protected readonly qaOpen = computed(() => {
    const ms = this.milestones();
    const open = ms.find((m) => m.id === 'qaOpen')!.t, close = ms.find((m) => m.id === 'qaClose')!.t;
    const n = this.now();
    return n >= open && n <= close;
  });

  private readonly ocean = viewChild.required(Ocean);
  private readonly heroEl = viewChild.required<ElementRef<HTMLElement>>('hero');
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  private io?: IntersectionObserver;
  private ctx?: gsap.Context;
  private clock = 0;

  ngAfterViewInit() {
    const root: HTMLElement = this.host.nativeElement;
    const ocean = this.ocean();
    ocean.setBands([{ el: this.heroEl().nativeElement, surface: false, palette: 2 }]);
    if (ocean.ready) root.classList.add('ocean-on');

    this.zone.runOutsideAngular(() => {
      this.clock = window.setInterval(() => this.now.set(Date.now()), 1000);
      this.ctx = gsap.context(() => this.build(), root);
    });

    if (typeof IntersectionObserver === 'undefined') return;
    this.io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) this.active.set(hit.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const s of this.sections) {
      const el = document.getElementById(s.id);
      if (el) this.io.observe(el);
    }
  }

  ngOnDestroy() {
    this.io?.disconnect();
    clearInterval(this.clock);
    this.ctx?.revert();
  }

  private build() {
    if (this.motion.reduced) return;
    const loop = gsap.to(this.track().nativeElement, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: this.heroEl().nativeElement, start: 'top top', end: 'bottom top',
      onUpdate: (st) => {
        const v = Math.max(-8, Math.min(8, st.getVelocity() / 300));
        gsap.to(loop, { timeScale: v >= 0 ? 1 + v : Math.min(-1, v), duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.3, ease: 'power2.out' });
      },
    });
    gsap.from('.hero [data-in]', { y: 28, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.from(el, { y: 32, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  protected go(ev: Event, id: string) {
    ev.preventDefault();
    this.motion.scrollTo('#' + id, -96);
  }

  protected fmt(iso: string, withDay = false) {
    return new Intl.DateTimeFormat('es-MX', {
      ...(withDay ? { weekday: 'long' as const } : {}), day: 'numeric', month: 'long', timeZone: 'America/Mexico_City',
    }).format(new Date(iso));
  }

  protected fmtShort(d?: string) {
    if (!d) return '';
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(d + 'T12:00:00Z')).replace('.', '');
  }

  protected isExternal(m: Material) { return !!m.href && /^https?:/.test(m.href); }

  protected actionLabel(m: Material) {
    switch (m.kind) {
      case 'Video': return 'Ver video';
      case 'Formulario': return 'Abrir';
      case 'Enlace': case 'CAD': return 'Abrir';
      default: return 'Descargar';
    }
  }
}
