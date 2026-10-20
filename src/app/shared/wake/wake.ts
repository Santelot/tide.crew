import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Wake — four skewed ticks trailing a baseline, lifted from the wordmark.
 * Its four colours live here and nowhere else.
 * `play` draws it in once (baseline first, then the ticks left → right).
 */
@Component({
  selector: 'tc-wake',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-playing]': 'play()', '[style.--w]': 'width()' },
  template: `
    <span class="tick t1"></span><span class="tick t2"></span><span class="tick t3"></span><span class="tick t4"></span>
    <span class="base"></span>
  `,
  styles: [`
    :host {
      --w: 220px; --d: 0ms;
      position: relative; display: block; width: var(--w); height: 14px;
    }
    .base {
      position: absolute; left: 62px; right: 0; bottom: 0; height: 2px;
      background: var(--tc-crest); transform-origin: left center;
    }
    .tick {
      position: absolute; bottom: 0; width: 9px; height: 14px; transform: skewX(-24deg);
    }
    .t1 { left: 0;    background: #CC2225; }
    .t2 { left: 15px; background: #F8D718; }
    .t3 { left: 30px; background: #36AB50; }
    .t4 { left: 45px; background: #4466EB; }

    :host(.is-playing) .base { animation: draw 900ms cubic-bezier(.2,.7,.1,1) calc(var(--d) + 120ms) both; }
    :host(.is-playing) .tick { animation: tick 420ms cubic-bezier(.2,.8,.2,1.2) both; }
    :host(.is-playing) .t1 { animation-delay: calc(var(--d) + 0ms); }
    :host(.is-playing) .t2 { animation-delay: calc(var(--d) + 70ms); }
    :host(.is-playing) .t3 { animation-delay: calc(var(--d) + 140ms); }
    :host(.is-playing) .t4 { animation-delay: calc(var(--d) + 210ms); }
    @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes tick { from { transform: skewX(-24deg) translateY(10px); opacity: 0; } to { transform: skewX(-24deg) translateY(0); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { :host(.is-playing) .base, :host(.is-playing) .tick { animation: none; } }
  `],
})
export class Wake {
  readonly play = input(false);
  readonly width = input('220px');
}
