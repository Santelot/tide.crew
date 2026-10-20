import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Wake } from '../../shared/wake/wake';
import { CONTACT } from '../../features/crew/crew.content';

// Drop the white horizontal lockup at public/brand/logo_h_white.png and it replaces the text mark.
const LOGO = '/brand/logo_h_white.png';

@Component({
  selector: 'app-crew-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Wake],
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>

    <header class="bar">
      <a routerLink="/FIRST" class="mark" aria-label="TideCrew, inicio">
        @if (logoOk()) {
          <img [src]="logo" alt="TideCrew" (error)="logoOk.set(false)" />
        } @else {
          <span class="mark__word">TideCrew</span>
        }
      </a>
      <nav class="links" aria-label="Principal">
        <a routerLink="/FIRST" fragment="tripulacion">Tripulación</a>
        <a routerLink="/game" routerLinkActive="is-here">TideChallenge</a>
        <a routerLink="/FIRST" fragment="patrocina" class="links__cta">Patrocina</a>
      </nav>
    </header>

    <main id="contenido"><router-outlet /></main>

    <footer class="foot">
      <p class="foot__promise">The tide always rises. So do we.</p>
      <tc-wake width="180px" />
      <div class="foot__row">
        <nav class="foot__links" aria-label="Pie de página">
          <a routerLink="/FIRST">Equipo</a>
          <a routerLink="/game">TideChallenge</a>
          <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
          @if (contact.instagram) { <a [href]="contact.instagram" rel="noopener" target="_blank">Instagram</a> }
          @if (contact.youtube) { <a [href]="contact.youtube" rel="noopener" target="_blank">YouTube</a> }
        </nav>
        <p class="foot__note">La tienda TideCrew abre muy pronto. Todo lo que vende financia temporadas de robótica.</p>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; position: relative; }
    .skip { position: absolute; left: -999px; top: 0; z-index: 50; background: var(--tc-foam); color: var(--tc-night); padding: .6rem 1rem; }
    .skip:focus { left: 1rem; top: 1rem; }

    .bar {
      position: sticky; top: 0; z-index: 20;
      display: flex; align-items: center; gap: 1.25rem;
      padding: .85rem clamp(1rem, 4vw, 3rem);
      background: color-mix(in srgb, var(--tc-night) 78%, transparent);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid color-mix(in srgb, var(--tc-slate) 70%, transparent);
    }
    .mark { display: inline-flex; align-items: center; text-decoration: none; color: var(--tc-foam); }
    .mark img { height: 30px; width: auto; display: block; }
    .mark__word { font-family: var(--tc-font-display); font-style: italic; text-transform: uppercase; font-size: 1.35rem; letter-spacing: .01em; line-height: 1; }
    .links { margin-left: auto; display: flex; align-items: center; gap: clamp(.8rem, 2.4vw, 2rem); font-size: .95rem; }
    .links a { color: color-mix(in srgb, var(--tc-foam) 82%, transparent); text-decoration: none; padding: .35rem 0; border-bottom: 2px solid transparent; }
    .links a:hover, .links a.is-here { color: var(--tc-foam); border-bottom-color: var(--tc-crest); }
    .links .links__cta { color: var(--tc-night); background: var(--tc-crest); padding: .45rem .85rem; border-radius: 2px; border: 0; font-weight: 500; }
    .links .links__cta:hover { background: var(--tc-foam); color: var(--tc-night); }
    @media (max-width: 520px) {
      .links { font-size: .85rem; gap: .75rem; }
      .links a:first-child { display: none; }
      .mark__word { font-size: 1.1rem; }
    }

    main { position: relative; z-index: 1; }

    .foot {
      position: relative; z-index: 1;
      padding: clamp(4rem, 10vw, 7rem) clamp(1rem, 4vw, 3rem) 2.5rem;
      display: grid; gap: 1.1rem;
    }
    .foot__promise {
      margin: 0; font-family: var(--tc-font-display); font-style: italic; text-transform: uppercase;
      font-size: clamp(1.6rem, 4.6vw, 3.2rem); line-height: 1; color: var(--tc-foam); max-width: 18ch;
    }
    .foot__row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem 3rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--tc-slate); }
    .foot__links { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; }
    .foot__links a { color: var(--tc-foam); text-decoration: none; font-size: .92rem; }
    .foot__links a:hover { color: var(--tc-crest); }
    .foot__note { margin: 0; max-width: 44ch; font-size: .88rem; color: color-mix(in srgb, var(--tc-foam) 68%, transparent); }
  `],
})
export class CrewLayout {
  protected readonly logo = LOGO;
  protected readonly logoOk = signal(true);
  protected readonly contact = CONTACT;
}
