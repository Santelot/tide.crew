import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { TideMode, TideService } from './tide.service';

/** Sine path, two periods-worth repeated across 2× the viewBox width so it can loop seamlessly. */
function wave(width: number, period: number, amp: number, base: number, depth: number): string {
  const pts: string[] = [`M0 ${base}`];
  for (let x = 0; x <= width; x += 8) {
    const y = base + Math.sin((x / period) * Math.PI * 2) * amp;
    pts.push(`L${x} ${y.toFixed(2)}`);
  }
  return pts.join(' ') + ` L${width} ${depth} L0 ${depth} Z`;
}
function crest(width: number, period: number, amp: number, base: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= width; x += 8) {
    const y = base + Math.sin((x / period) * Math.PI * 2) * amp;
    pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

@Component({
  selector: 'tc-tide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="water">
      <svg class="swell swell--back" viewBox="0 0 2880 60" preserveAspectRatio="none">
        <path [attr.d]="backPath" />
      </svg>
      <svg class="swell swell--front" viewBox="0 0 2880 60" preserveAspectRatio="none">
        <path class="fill" [attr.d]="frontPath" />
        <path class="line" [attr.d]="crestPath" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="depth"></div>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    .water {
      position: absolute; left: 0; right: 0; top: 0; height: 130vh;
      transform: translate3d(0, calc(var(--tide-y, 86vh) - 28px), 0);
      will-change: transform;
    }
    .swell { position: absolute; left: 0; width: 200%; height: 36px; display: block; }
    .swell--back { top: 0; opacity: .45; animation: drift 34s linear infinite reverse; }
    .swell--back path { fill: var(--tc-slate); }
    .swell--front { top: 6px; animation: drift 22s linear infinite; }
    .fill { fill: var(--tc-undertow); }
    .line { fill: none; stroke: var(--tc-crest); stroke-width: 1.5; opacity: .9; }
    .depth {
      position: absolute; left: 0; right: 0; top: 40px; bottom: 0;
      background: linear-gradient(180deg, var(--tc-undertow) 0%, var(--tc-night) 70%);
    }
    @keyframes drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @media (prefers-reduced-motion: reduce) { .swell { animation: none; } }
  `],
})
export class Tide implements OnInit {
  readonly mode = input<TideMode>('rise');
  private readonly tide = inject(TideService);

  protected readonly backPath = wave(2880, 360, 7, 26, 60);
  protected readonly frontPath = wave(2880, 480, 9, 22, 60);
  protected readonly crestPath = crest(2880, 480, 9, 22);

  ngOnInit() {
    this.tide.setMode(this.mode());
  }
}
