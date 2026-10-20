import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <p class="hero__eyebrow">{{ t('hero.eyebrow') }}</p>
      <h1 class="hero__creed">Ride the Tide</h1>
      <p class="hero__promise">La marea siempre sube. Nosotros también.</p>
      <a routerLink="/store" class="hero__cta">{{ t('hero.cta') }}</a>
    </section>
  `,
  styles: [`
    .hero { padding: clamp(3rem, 12vh, 9rem) 1.5rem; text-align: center; max-width: 60rem; margin: 0 auto; }
    .hero__eyebrow { color: var(--tc-crest); letter-spacing: .12em; text-transform: uppercase; font-size: .8rem; }
    .hero__creed { font-family: var(--tc-font-display); font-size: clamp(3rem, 10vw, 6rem); margin: .25em 0; color: var(--tc-foam); }
    .hero__promise { color: color-mix(in srgb, var(--tc-foam) 70%, transparent); font-size: 1.1rem; }
    .hero__cta { display: inline-block; margin-top: 2rem; padding: .9rem 1.8rem; border-radius: var(--tc-radius-pill);
      background: var(--tc-pacific); color: var(--tc-night); font-weight: 600; text-decoration: none; }
    .hero__cta:hover { background: var(--tc-crest); }
  `],
})
export class Home {
  protected readonly t = inject(I18nService).t;
}
