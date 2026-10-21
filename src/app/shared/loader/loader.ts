import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject, input, output,
} from '@angular/core';
import { Mark } from '../mark/mark';
import { gsap } from '../motion/motion.service';

/**
 * Deep-water intro. The mark assembles splash by splash while the tide line
 * fills, then the whole panel lifts away on a wave edge to reveal the day.
 */
@Component({
  selector: 'tc-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Mark],
  template: `
    <div class="panel">
      <div class="bubbles" aria-hidden="true">
        @for (b of bubbles; track $index) {
          <i [style.left.%]="b.x" [style.width.px]="b.r" [style.height.px]="b.r" [style.animation-duration.s]="b.d" [style.animation-delay.s]="b.delay"></i>
        }
      </div>
      <div class="center">
        <tc-mark class="mk" tone="color" />
        <p class="anthem">Ride the Tide</p>
        <div class="bar" aria-hidden="true"><span class="fill"></span></div>
        <p class="status" role="status">{{ text() }}</p>
      </div>
      <button type="button" class="skip" (click)="finish(true)">{{ skip() }}</button>
      <svg class="edge" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,0 L1440,0 L1440,60 C1320,95 1200,110 1080,92 C960,74 840,30 720,34 C600,38 480,92 360,100 C240,108 120,80 0,58 Z" />
      </svg>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 1000; pointer-events: auto; }
    .panel {
      position: absolute; inset: 0 0 auto 0; height: calc(100% + 0px);
      background: linear-gradient(180deg, #111921 0%, #111921 40%, #00434A 100%);
      display: grid; place-items: center; overflow: visible;
    }
    .edge { position: absolute; left: 0; right: 0; top: 100%; width: 100%; height: 12vh; margin-top: -1px; display: block; }
    .edge path { fill: #00434A; }
    .center { position: relative; z-index: 2; display: grid; justify-items: center; text-align: center; padding: 0 24px; }
    .mk { width: clamp(110px, 16vw, 168px); height: auto; aspect-ratio: 2340.6 / 2392.29; }
    .anthem {
      margin: 28px 0 0; color: #FFFBFE; font-family: var(--tc-font-display); font-style: italic; text-transform: uppercase;
      font-size: clamp(1.7rem, 1.2rem + 2vw, 2.6rem); letter-spacing: .01em; line-height: 1;
    }
    .bar { margin-top: 26px; width: 200px; height: 2px; background: rgba(255,251,254,.16); overflow: hidden; }
    .fill { display: block; height: 100%; width: 100%; background: #00CFE6; transform-origin: left; transform: scaleX(0); }
    .status { margin: 14px 0 0; font: 500 .8rem/1 var(--tc-font-body); letter-spacing: .08em; color: rgba(255,251,254,.6); }
    .skip {
      position: absolute; right: 24px; bottom: 26px; z-index: 3; background: none; border: 0; cursor: pointer;
      color: rgba(255,251,254,.7); font: 500 .85rem/1 var(--tc-font-body); padding: 10px 6px; text-decoration: underline; text-underline-offset: 4px;
    }
    .skip:hover, .skip:focus-visible { color: #FFFBFE; }
    .bubbles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .bubbles i {
      position: absolute; bottom: -20px; border-radius: 50%; border: 1.5px solid rgba(0,207,230,.55);
      animation-name: rise; animation-timing-function: ease-in; animation-iteration-count: infinite;
    }
    @keyframes rise { from { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } to { transform: translateY(-110vh) translateX(18px); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .bubbles { display: none; } }
  `],
})
export class Loader implements AfterViewInit, OnDestroy {
  readonly text = input('');
  readonly skip = input('');
  readonly done = output<void>();
  /** Fires as the panel starts lifting, so the page can begin its entrance underneath. */
  readonly leaving = output<void>();
  private readonly el = inject(ElementRef<HTMLElement>);
  private tl?: gsap.core.Timeline;
  private finished = false;
  private safety?: ReturnType<typeof setTimeout>;

  protected readonly bubbles = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 37) % 100, r: 5 + ((i * 7) % 12), d: 6 + ((i * 3) % 6), delay: (i * 0.45) % 5,
  }));

  ngAfterViewInit() {
    const root: HTMLElement = this.el.nativeElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = (s: string) => root.querySelectorAll(s);
    // Never let the intro hang on a slow font: wait at most 2.5s for fonts.
    const fonts = Promise.race([(document as any).fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
    // Hard ceiling, whatever happens.
    this.safety = setTimeout(() => this.finish(), 6000);

    if (reduced) {
      gsap.set(q('.fill'), { scaleX: 1 });
      fonts.then(() => setTimeout(() => this.finish(), 350));
      return;
    }

    gsap.set(root.querySelectorAll('.m-piece, .anthem, .status, .skip'), { opacity: 0 });
    requestAnimationFrame(() => requestAnimationFrame(() => this.play(root, fonts)));
  }

  private play(root: HTMLElement, fonts: Promise<unknown>) {
    const q = (s: string) => root.querySelectorAll(s);
    gsap.set(root.querySelectorAll('.m-piece, .anthem, .status, .skip'), { clearProps: 'opacity' });
    const order = ['.m-drop', '.m-spray', '.m-wave', '.m-inner', '.m-curl', '.m-ray'];
    this.tl = gsap.timeline();
    this.tl
      .from(order.map((s) => root.querySelector(s)), {
        opacity: 0, scale: 0.55, rotation: -28, y: 40, duration: 0.75, ease: 'back.out(1.6)', stagger: 0.12,
      })
      .from(q('.anthem'), { opacity: 0, y: 18, duration: 0.6, ease: 'power3.out' }, '-=0.35')
      .to(q('.fill'), { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      .from(q('.status, .skip'), { opacity: 0, duration: 0.5 }, 0.4);

    Promise.all([fonts, new Promise((r) => this.tl!.eventCallback('onComplete', r))]).then(() => this.finish());
  }

  ngOnDestroy() { this.tl?.kill(); clearTimeout(this.safety); }

  finish(skipped = false) {
    if (this.finished) return;
    this.finished = true;
    clearTimeout(this.safety);
    this.tl?.kill();
    const root: HTMLElement = this.el.nativeElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.leaving.emit();
    if (reduced) { this.done.emit(); return; }
    gsap.timeline({ onComplete: () => this.done.emit() })
      .to(root.querySelector('.center'), { y: -60, opacity: 0, duration: skipped ? 0.25 : 0.45, ease: 'power2.in' })
      .to(root.querySelector('.panel'), { yPercent: -112, duration: skipped ? 0.7 : 1.05, ease: 'expo.inOut' }, '-=0.15');
  }
}
