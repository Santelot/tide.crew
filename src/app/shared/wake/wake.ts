import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Wake — the underline with four ticks of motion trailing it, as in the
 * wordmark. The tick colours live here and nowhere else.
 * `play` draws it once: the line runs out, then the ticks follow.
 */
@Component({
  selector: 'tc-wake',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-playing]': 'play()', '[class.is-static]': '!animate()', '[style.--w]': 'width()' },
  template: `
    <span class="base"></span>
    <span class="tick t1"></span><span class="tick t2"></span><span class="tick t3"></span><span class="tick t4"></span>
  `,
  styles: [`
    :host { --w: 220px; --d: 0ms; --tk: 7px; position: relative; display: block; width: var(--w); height: 6px; color: var(--wake-color, currentColor); }
    .base { position: absolute; left: 0; right: calc(var(--tk) * 6.4); top: 0; bottom: 0; background: currentColor; transform-origin: left center; border-radius: 1px; }
    .tick { position: absolute; top: 0; bottom: 0; width: calc(var(--tk) * 1.15); transform: skewX(-28deg); border-radius: 1px; }
    .t1 { right: calc(var(--tk) * 4.8); background: #CC2225; }
    .t2 { right: calc(var(--tk) * 3.2); background: #F8D718; }
    .t3 { right: calc(var(--tk) * 1.6); background: #36AB50; }
    .t4 { right: 0; background: #4466EB; }

    :host(:not(.is-static)) .base { transform: scaleX(0); }
    :host(:not(.is-static)) .tick { opacity: 0; }
    :host(.is-playing) .base { animation: draw 900ms cubic-bezier(.2,.7,.1,1) var(--d) both; }
    :host(.is-playing) .tick { animation: tick 380ms cubic-bezier(.2,.8,.2,1.3) both; }
    :host(.is-playing) .t1 { animation-delay: calc(var(--d) + 640ms); }
    :host(.is-playing) .t2 { animation-delay: calc(var(--d) + 710ms); }
    :host(.is-playing) .t3 { animation-delay: calc(var(--d) + 780ms); }
    :host(.is-playing) .t4 { animation-delay: calc(var(--d) + 850ms); }
    @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes tick { from { opacity: 0; transform: skewX(-28deg) translateX(-10px); } to { opacity: 1; transform: skewX(-28deg) translateX(0); } }
    @media (prefers-reduced-motion: reduce) {
      :host(:not(.is-static)) .base { transform: none; }
      :host(:not(.is-static)) .tick { opacity: 1; }
      :host(.is-playing) .base, :host(.is-playing) .tick { animation: none; }
    }
  `],
})
export class Wake {
  readonly play = input(false);
  /** false = always fully drawn (no entrance). */
  readonly animate = input(true);
  readonly width = input('220px');
}
