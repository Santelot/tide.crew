import { Injectable, NgZone, inject } from '@angular/core';

export type TideMode = 'rise' | 'low';

/**
 * One scroll loop for the whole page. It eases a "water level" toward the
 * scroll position and publishes the waterline (in viewport px) as the CSS
 * variable --tide-y on <html>. Anything can listen with onFrame().
 */
@Injectable({ providedIn: 'root' })
export class TideService {
  private readonly zone = inject(NgZone);
  private mode: TideMode = 'rise';
  private level = 0.1;
  private target = 0.1;
  private raf = 0;
  private running = false;
  private listeners = new Set<(waterY: number) => void>();
  private readonly reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Waterline in viewport pixels (0 = top of screen). */
  waterY = 0;

  setMode(mode: TideMode) {
    this.mode = mode;
    this.computeTarget();
    this.level = this.target * (mode === 'rise' ? 0.6 : 1);
    this.start();
  }

  onFrame(fn: (waterY: number) => void): () => void {
    this.listeners.add(fn);
    fn(this.waterY);
    return () => this.listeners.delete(fn);
  }

  private computeTarget() {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    // rise: starts as a low tide and fills to ~80% of the screen at the bottom of the page.
    // low: a calm, nearly fixed band for utility pages.
    this.target = this.mode === 'rise' ? 0.07 + p * 0.73 : 0.035 + p * 0.015;
  }

  private start() {
    if (this.running || typeof window === 'undefined') return;
    this.running = true;
    this.zone.runOutsideAngular(() => {
      const onScroll = () => this.computeTarget();
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      const tick = () => {
        const k = this.reduced ? 1 : 0.06;
        this.level += (this.target - this.level) * k;
        const y = Math.round(innerHeight * (1 - this.level));
        if (y !== this.waterY) {
          this.waterY = y;
          document.documentElement.style.setProperty('--tide-y', `${y}px`);
          this.listeners.forEach((fn) => fn(y));
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }
}
