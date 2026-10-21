import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, inject, viewChild,
} from '@angular/core';

/**
 * A quiet custom cursor for mouse users: a dot that is exactly where you point,
 * and a ring that follows with a little weight. The ring grows over anything you
 * can click, and turns into a bubble over water. Touch, pen and reduced-motion
 * users keep their normal pointer.
 */
@Component({
  selector: 'tc-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<span class="ring" #ring><i></i></span><span class="dot" #dot></span>`,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 2000; pointer-events: none; display: none; }
    :host(.is-on) { display: block; }
    .dot, .ring { position: fixed; left: 0; top: 0; border-radius: 50%; will-change: transform; }
    .dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: var(--c, #111921); transition: background-color .25s, opacity .2s; }
    .ring {
      width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 1.5px solid var(--c, #111921);
      opacity: .55; transition: width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1), margin .35s cubic-bezier(.2,.8,.2,1),
        border-color .25s, background-color .3s, opacity .3s;
    }
    .ring i { position: absolute; left: 22%; top: 18%; width: 22%; height: 22%; border-radius: 50%; background: #FFFBFE; opacity: 0; transition: opacity .3s; }
    :host(.is-light) { --c: #FFFBFE; }
    :host(.is-link) .ring { width: 62px; height: 62px; margin: -31px 0 0 -31px; opacity: .9; background: color-mix(in srgb, var(--c) 10%, transparent); }
    :host(.is-link) .dot { opacity: 0; }
    :host(.is-water) .ring { width: 44px; height: 44px; margin: -22px 0 0 -22px; opacity: .85; border-color: rgba(255,251,254,.9);
      background: radial-gradient(circle at 35% 30%, rgba(255,251,254,.28), rgba(0,207,230,.10) 55%, rgba(0,207,230,.02) 70%); }
    :host(.is-water) .ring i { opacity: .9; }
    :host(.is-water) .dot { background: #00CFE6; }
    :host(.is-down) .ring { width: 26px; height: 26px; margin: -13px 0 0 -13px; }
    :host(.is-out) .dot, :host(.is-out) .ring { opacity: 0; }
  `],
})
export class Cursor implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly dot = viewChild.required<ElementRef<HTMLElement>>('dot');
  private readonly ring = viewChild.required<ElementRef<HTMLElement>>('ring');

  private x = -100; private y = -100;
  private rx = -100; private ry = -100;
  private raf = 0;
  private active = false;

  ngAfterViewInit() {
    const ok = matchMedia('(pointer: fine) and (hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ok) return;
    this.active = true;
    const el: HTMLElement = this.host.nativeElement;
    el.classList.add('is-on');
    document.documentElement.classList.add('has-cursor');
    this.zone.runOutsideAngular(() => {
      addEventListener('pointermove', this.move, { passive: true });
      addEventListener('pointerdown', this.down, { passive: true });
      addEventListener('pointerup', this.up, { passive: true });
      document.addEventListener('pointerleave', this.leave);
      document.addEventListener('pointerenter', this.enter);
      this.raf = requestAnimationFrame(this.tick);
    });
  }

  ngOnDestroy() {
    if (!this.active) return;
    cancelAnimationFrame(this.raf);
    removeEventListener('pointermove', this.move);
    removeEventListener('pointerdown', this.down);
    removeEventListener('pointerup', this.up);
    document.removeEventListener('pointerleave', this.leave);
    document.removeEventListener('pointerenter', this.enter);
    document.documentElement.classList.remove('has-cursor');
  }

  private move = (ev: PointerEvent) => {
    if (ev.pointerType !== 'mouse') return;
    this.x = ev.clientX; this.y = ev.clientY;
    const t = ev.target as Element | null;
    const el: HTMLElement = this.host.nativeElement;
    const link = !!t?.closest?.('a, button, [role="tab"], .lvl, label, summary');
    const water = !link && !!t?.closest?.('[data-water]') && !t?.closest?.('.card, .prog, .clock, .award__badge, .aud, .direct');
    const tone = (t?.closest?.('[data-tone]') as HTMLElement | null)?.dataset['tone'];
    el.classList.toggle('is-link', link);
    el.classList.toggle('is-water', water);
    el.classList.toggle('is-light', tone === 'dark' || tone === 'pacific');
    el.classList.remove('is-out');
  };
  private down = () => this.host.nativeElement.classList.add('is-down');
  private up = () => this.host.nativeElement.classList.remove('is-down');
  private leave = () => this.host.nativeElement.classList.add('is-out');
  private enter = () => this.host.nativeElement.classList.remove('is-out');

  private tick = () => {
    this.rx += (this.x - this.rx) * 0.2;
    this.ry += (this.y - this.ry) * 0.2;
    this.dot().nativeElement.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
    this.ring().nativeElement.style.transform = `translate3d(${this.rx}px, ${this.ry}px, 0)`;
    this.raf = requestAnimationFrame(this.tick);
  };
}
