import { Injectable, NgZone, inject } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * One smooth-scroll engine for the crew zone. Lenis drives the scroll,
 * GSAP's ticker drives Lenis, and ScrollTrigger reads from it — so every
 * scroll-linked animation stays on the same frame.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly zone = inject(NgZone);
  readonly reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  lenis: Lenis | null = null;
  private tick = (time: number) => this.lenis?.raf(time * 1000);
  private users = 0;

  start() {
    this.users++;
    if (this.lenis || this.reduced) return;
    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), touchMultiplier: 1.4 });
      this.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(this.tick);
      // Keep lag smoothing: a janky first second must not fast-forward the intro.
      gsap.ticker.lagSmoothing(500, 33);
    });
  }

  stop() {
    this.users = Math.max(0, this.users - 1);
    if (this.users > 0) return;
    gsap.ticker.remove(this.tick);
    this.lenis?.destroy();
    this.lenis = null;
  }

  lock(on: boolean) { on ? this.lenis?.stop() : this.lenis?.start(); }

  /** Jump instantly (used while the screen is covered). */
  jump(y: number) {
    if (this.lenis) { this.lenis.resize(); this.lenis.scrollTo(y, { immediate: true, force: true }); }
    else window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    ScrollTrigger.refresh();
  }

  scrollTo(target: string | HTMLElement | number, offset = 0) {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (el === null) return;
    if (this.lenis) this.lenis.scrollTo(el as HTMLElement | number, { offset, duration: 1.6 });
    else if (typeof el === 'number') scrollTo({ top: el });
    else el.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth' });
  }
}

export { gsap, ScrollTrigger };
