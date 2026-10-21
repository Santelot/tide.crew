import {
  ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LangService } from '../../core/lang.service';
import { COACHES, COPY, CONTACT_EMAIL, SOCIAL } from '../../features/crew/landing.content';
import { SectionService } from '../../shared/motion/section.service';
import { Loader } from '../../shared/loader/loader';
import { Mark } from '../../shared/mark/mark';
import { MotionService, gsap } from '../../shared/motion/motion.service';
import { IntroService } from '../../shared/motion/intro.service';
import { Wake } from '../../shared/wake/wake';
import { Cursor } from '../../shared/cursor/cursor';
import { TideSound } from '../../shared/ocean/tide-sound.service';

@Component({
  selector: 'app-crew-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Cursor, Loader, Mark, Wake],
  templateUrl: './crew-layout.html',
  styleUrl: './crew-layout.scss',
})
export class CrewLayout implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  protected readonly motion = inject(MotionService);
  protected readonly intro = inject(IntroService);
  protected readonly langSvc = inject(LangService);
  protected readonly c = computed(() => COPY[this.langSvc.lang()]);
  protected readonly sections = inject(SectionService);
  protected readonly sound = inject(TideSound);
  private readonly ascentEl = viewChild<ElementRef<HTMLElement>>('ascent');
  protected readonly bubbles = Array.from({ length: 18 }, (_, i) => ({ x: (i * 37 + 11) % 100, r: 6 + ((i * 7) % 18), d: 0.9 + ((i * 3) % 7) * 0.12, delay: ((i * 5) % 9) * 0.08 }));
  protected readonly email = CONTACT_EMAIL;
  protected readonly coaches = COACHES;
  protected readonly social = SOCIAL;
  protected readonly links = computed(() => {
    const n = this.c().nav;
    return [
      { id: 'tidecrew', label: n.tidecrew }, { id: 'equipos', label: n.teams }, { id: 'trayectoria', label: n.history },
      { id: 'impacto', label: n.impact }, { id: 'tidechallenge', label: n.challenge },
    ];
  });
  protected readonly year = new Date().getFullYear();

  protected readonly loader = signal(this.intro.showLoader());
  protected readonly tone = signal<'light' | 'dark' | 'pacific'>('light');
  protected readonly hidden = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly menu = signal(false);

  private raf = 0;
  private lastY = 0;
  private sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
    this.menu.set(false);
    this.motion.lock(false);
    // Every new page starts at the top. Smooth scrolling keeps its own idea of the
    // scroll position, so without this a new page could open wherever the last one was.
    if (!(e as NavigationEnd).urlAfterRedirects.includes('#')) {
      this.motion.jump(0);
      setTimeout(() => this.motion.jump(0), 60);
    }
    queueMicrotask(() => this.probe());
  });

  ngOnInit() {
    try { history.scrollRestoration = 'manual'; } catch { /* not supported */ }
    this.motion.start();
    if (!this.loader()) this.intro.clear();
    else this.motion.lock(true);
    this.zone.runOutsideAngular(() => {
      addEventListener('scroll', this.onScroll, { passive: true });
      addEventListener('resize', this.onScroll, { passive: true });
    });
    this.probe();
  }

  ngOnDestroy() {
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onScroll);
    cancelAnimationFrame(this.raf);
    this.sub.unsubscribe();
    this.motion.stop();
  }

  protected loaderLeaving() {
    this.intro.clear();
    this.motion.lock(false);
  }

  protected setLang(l: 'es' | 'en') { this.langSvc.set(l); }

  protected toggleMenu() {
    const open = !this.menu();
    this.menu.set(open);
    this.motion.lock(open);
  }

  /** Section links: smooth-scroll on the landing, navigate there from anywhere else. */
  protected go(ev: Event, id: string) {
    ev.preventDefault();
    this.menu.set(false);
    this.motion.lock(false);
    if (id === 'top') { this.ascend(); return; }
    const onLanding = this.router.url.split('#')[0].split('?')[0] === '/FIRST';
    if (onLanding) { this.motion.scrollTo('#' + id, id === 'top' ? 0 : -10); return; }
    this.router.navigateByUrl('/FIRST').then(() => setTimeout(() => this.motion.scrollTo('#' + id, -10), 120));
  }

  protected toTop() { this.ascend(); }

  /**
   * The way back up: the sea floods the screen, carries you to the top, and
   * drains away to leave you at the surface, where the mark gets a splash.
   */
  private ascending = false;
  protected ascend() {
    if (this.ascending) return;
    const onLanding = this.router.url.split('#')[0].split('?')[0] === '/FIRST';
    if (this.motion.reduced || !onLanding || scrollY < innerHeight * 1.5) { this.motion.scrollTo(0); return; }
    const el = this.ascentEl()?.nativeElement;
    if (!el) { this.motion.scrollTo(0); return; }
    this.ascending = true;
    this.motion.lock(true);
    [0, 0.18, 0.4].forEach((d, i) => setTimeout(() => this.sound.bloop(0.5 - i * 0.2), d * 1000));
    gsap.timeline({ onComplete: () => { this.ascending = false; } })
      .set(el, { yPercent: 100, visibility: 'visible' })
      .to(el, { yPercent: 0, duration: 0.75, ease: 'power3.in' })
      .add(() => { this.motion.lock(false); this.motion.jump(0); this.motion.lock(true); })
      .to(el, { yPercent: 100, duration: 1.05, ease: 'power3.inOut' }, '+=0.22')
      .add(() => this.sections.surfaced.update((n) => n + 1), '-=0.3')
      .add(() => this.motion.lock(false))
      .set(el, { visibility: 'hidden' });
  }

  private onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.probe());
  };

  /** Read what's under the nav to pick its tone. The nav itself stays fixed. */
  private probe() {
    const y = scrollY;
    const els = document.elementsFromPoint(innerWidth / 2, 34);
    const sec = els.map((e) => (e as HTMLElement).closest?.('[data-tone]') as HTMLElement | null).find(Boolean);
    const t = (sec?.dataset['tone'] as 'light' | 'dark' | 'pacific') ?? 'light';
    this.zone.run(() => {
      if (t !== this.tone()) this.tone.set(t);
      this.scrolled.set(y > 12);
    });
    this.lastY = y;
  }
}
