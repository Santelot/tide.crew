import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Mark } from '../../../shared/mark/mark';
import { MotionService } from '../../../shared/motion/motion.service';
import { QaService } from './qa/qa.service';

/**
 * The TideChallenge hub's own navigation: the challenge first, TideCrew second.
 * Used by /game, /game/qa and /game/admin.
 */
@Component({
  selector: 'tc-hub-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Mark],
  template: `
    <header class="bar" [class.is-open]="open()">
      <a class="brand" routerLink="/game" (click)="close()" aria-label="TideChallenge, inicio del hub">
        <tc-mark class="brand__mk" tone="color" label="" />
        <span class="brand__name">TideChallenge</span>
        <span class="brand__season">Offseason 2026</span>
      </a>

      <nav class="links" aria-label="Hub del reto">
        <a href="/game#manual" (click)="go($event, 'manual')">Manual</a>
        <a href="/game#campo" (click)="go($event, 'campo')">Campo</a>
        <a href="/game#actualizaciones" (click)="go($event, 'actualizaciones')">Actualizaciones</a>
        <a routerLink="/game/qa" [class.on]="here() === 'qa'" (click)="close()">Q&amp;A</a>
        <a href="/game#registro" (click)="go($event, 'registro')">Registro</a>
      </nav>

      <div class="side">
        @if (qa.team(); as t) {
          <a class="team" routerLink="/game/qa" (click)="close()" title="Tu sesión de equipo">
            <i aria-hidden="true"></i><span class="team__k">Equipo </span>{{ t.number }}
          </a>
          <button type="button" class="ghost" (click)="logout()">Salir</button>
        } @else {
          <a class="enter" routerLink="/game/qa" [queryParams]="{ entrar: 1 }" (click)="close()">Entrar</a>
        }
        <a class="home" routerLink="/FIRST" (click)="close()">TideCrew <span aria-hidden="true">↗</span></a>
        <button type="button" class="burger" [attr.aria-expanded]="open()" aria-label="Menú" (click)="open.set(!open())"><i></i><i></i></button>
      </div>
    </header>
  `,
  styles: [`
    :host { position: fixed; top: 0; left: 0; right: 0; z-index: 300; display: block; }
    .bar {
      --g: clamp(1.1rem, 4vw, 3.5rem);
      display: flex; align-items: center; gap: 1.5rem; height: 64px; padding: 0 var(--g); color: #FFFBFE;
      background: color-mix(in srgb, #111921 78%, transparent); backdrop-filter: saturate(1.3) blur(14px); -webkit-backdrop-filter: saturate(1.3) blur(14px);
      border-bottom: 1px solid rgba(255, 251, 254, .1);
    }
    .brand { display: flex; align-items: center; gap: .65rem; color: inherit; text-decoration: none; flex: none; }
    .brand__mk { width: 30px; height: 30px; }
    .brand__name { font-family: var(--tc-font-display); font-style: italic; text-transform: uppercase; font-size: 1.45rem; line-height: 1; letter-spacing: .01em; }
    .brand__season { padding: .3rem .55rem; border-radius: 999px; border: 1px solid rgba(0, 207, 230, .5); color: #00CFE6; font: 600 .7rem/1 var(--tc-font-body); letter-spacing: .06em; text-transform: uppercase; }
    .links { display: flex; gap: clamp(.9rem, 2vw, 1.8rem); margin-left: auto; }
    .links a { position: relative; color: rgba(255, 251, 254, .82); text-decoration: none; font: 500 .93rem/1 var(--tc-font-body); padding: .45rem 0; transition: color .25s; }
    .links a::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: #00CFE6; transform: scaleX(0); transform-origin: right; transition: transform .4s cubic-bezier(.7, 0, .2, 1); }
    .links a:hover, .links a.on { color: #FFFBFE; }
    .links a:hover::after, .links a.on::after { transform: scaleX(1); transform-origin: left; }
    .side { display: flex; align-items: center; gap: .7rem; }
    .enter, .team { display: inline-flex; align-items: center; gap: .5rem; height: 38px; padding: 0 1rem; border-radius: 3px; text-decoration: none; font: 600 .9rem/1 var(--tc-font-body); }
    .enter { background: #00CFE6; color: #111921; transition: background-color .25s; }
    .enter:hover { background: #FFFBFE; }
    .team { border: 1px solid rgba(255, 251, 254, .3); color: #FFFBFE; white-space: nowrap; }
    .team i { width: 8px; height: 8px; border-radius: 50%; background: #36AB50; box-shadow: 0 0 0 3px rgba(54, 171, 80, .25); }
    .ghost { background: none; border: 0; color: rgba(255, 251, 254, .7); cursor: pointer; font: 500 .88rem/1 var(--tc-font-body); padding: .4rem; }
    .ghost:hover { color: #FFFBFE; }
    .home { color: rgba(255, 251, 254, .65); text-decoration: none; font: 500 .85rem/1 var(--tc-font-body); padding-left: .7rem; border-left: 1px solid rgba(255, 251, 254, .2); }
    .home:hover { color: #FFFBFE; }
    .burger { display: none; position: relative; width: 40px; height: 40px; border: 0; background: none; color: inherit; cursor: pointer; }
    .burger i { position: absolute; left: 10px; right: 10px; height: 2px; background: currentColor; transition: transform .35s, top .35s; }
    .burger i:first-child { top: 15px; } .burger i:last-child { top: 23px; }
    .is-open .burger i:first-child { top: 19px; transform: rotate(45deg); }
    .is-open .burger i:last-child { top: 19px; transform: rotate(-45deg); }
    a:focus-visible, button:focus-visible { outline: 2px solid #00CFE6; outline-offset: 3px; }
    @media (max-width: 1080px) {
      .home, .brand__season { display: none; }
      .burger { display: block; }
      .links {
        position: absolute; top: 64px; left: 0; right: 0; margin: 0; flex-direction: column; gap: 0; padding: .5rem var(--g) 1.2rem;
        background: #111921; border-bottom: 1px solid rgba(255, 251, 254, .1);
        opacity: 0; visibility: hidden; transform: translateY(-8px); transition: opacity .3s, transform .35s, visibility 0s linear .35s;
      }
      .links a { padding: .9rem 0; font-size: 1.05rem; border-bottom: 1px solid rgba(255, 251, 254, .08); }
      .links a::after { display: none; }
      .is-open .links { opacity: 1; visibility: visible; transform: none; transition: opacity .3s, transform .35s; }
    }
    @media (max-width: 520px) { .ghost, .team__k { display: none; } .brand__name { font-size: 1.2rem; } .team, .enter { padding: 0 .75rem; } }
  `],
})
export class HubNav {
  protected readonly qa = inject(QaService);
  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  readonly here = input<'hub' | 'qa' | 'admin'>('hub');
  protected readonly open = signal(false);

  protected close() { this.open.set(false); }

  protected go(ev: Event, id: string) {
    ev.preventDefault();
    this.close();
    if (this.router.url.split(/[?#]/)[0] === '/game') { this.motion.scrollTo('#' + id, -84); return; }
    this.router.navigate(['/game'], { fragment: id }).then(() => setTimeout(() => this.motion.scrollTo('#' + id, -84), 150));
  }

  protected async logout() {
    await this.qa.logoutTeam();
  }
}
