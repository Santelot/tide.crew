import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideShoppingCart, LucideGlobe, LucideUser, LucideWaves } from '@lucide/angular';
import { I18nService } from '../../core/i18n.service';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-store-layout',
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet,
    LucideShoppingCart, LucideGlobe, LucideUser, LucideWaves,
  ],
  template: `
    <header class="nav">
      <a routerLink="/" class="brand">
        <svg lucideWaves class="brand__mark"></svg>
        <span class="brand__word">TideCrew</span>
      </a>

      <nav class="nav__links">
        <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">{{ t('nav.home') }}</a>
        <a routerLink="/store" routerLinkActive="is-active">{{ t('nav.shop') }}</a>
        <a routerLink="/team" routerLinkActive="is-active">{{ t('nav.team') }}</a>
      </nav>

      <div class="nav__actions">
        <button type="button" class="lang" (click)="i18n.toggle()">
          <svg lucideGlobe class="ic"></svg>
          {{ i18n.lang() === 'es' ? 'ES' : 'EN' }}
        </button>

        @if (auth.isLoggedIn()) {
          <a routerLink="/account" class="ghost"><svg lucideUser class="ic"></svg>{{ t('nav.account') }}</a>
        } @else {
          <a routerLink="/login" class="ghost">{{ t('nav.login') }}</a>
        }

        @if (auth.isAdmin()) {
          <a routerLink="/admin" class="ghost ghost--admin">Admin</a>
        }

        <a routerLink="/cart" class="cart" aria-label="cart">
          <svg lucideShoppingCart class="ic"></svg>
          @if (cart.count() > 0) { <span class="badge">{{ cart.count() }}</span> }
        </a>
      </div>
    </header>

    <main class="shell"><router-outlet /></main>

    <footer class="foot">
      <a routerLink="/team">{{ t('footer.team') }}</a>
      <span>{{ t('footer.rights') }}</span>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .nav { display: flex; align-items: center; gap: 1.5rem; padding: 1rem 1.5rem; position: sticky; top: 0; z-index: 10;
      border-bottom: 1px solid color-mix(in srgb, var(--tc-foam) 10%, transparent);
      background: color-mix(in srgb, var(--tc-night) 85%, transparent); backdrop-filter: blur(8px); }
    .brand { display: inline-flex; align-items: center; gap: .55rem; text-decoration: none; font-family: var(--tc-font-title); font-size: 1.15rem; }
    .brand__mark { width: 22px; height: 22px; color: var(--tc-crest); }
    .brand__word { color: var(--tc-foam); }
    .nav__links { display: flex; gap: 1.2rem; }
    .nav__links a { text-decoration: none; color: color-mix(in srgb, var(--tc-foam) 78%, transparent); font-size: .95rem; }
    .nav__links a:hover, .nav__links a.is-active { color: var(--tc-crest); }
    .nav__actions { margin-left: auto; display: flex; align-items: center; gap: .9rem; }
    .lang { display: inline-flex; align-items: center; gap: .35rem; background: none; cursor: pointer; color: var(--tc-foam);
      border: 1px solid color-mix(in srgb, var(--tc-foam) 18%, transparent); border-radius: var(--tc-radius-pill); padding: .3rem .7rem; font-size: .8rem; }
    .lang:hover { border-color: var(--tc-pacific); }
    .ghost { text-decoration: none; display: inline-flex; align-items: center; gap: .35rem; font-size: .9rem; color: color-mix(in srgb, var(--tc-foam) 85%, transparent); }
    .ghost:hover { color: var(--tc-crest); }
    .ghost--admin { color: var(--tc-coral); }
    .cart { color: var(--tc-foam); display: inline-flex; position: relative; }
    .cart:hover { color: var(--tc-crest); }
    .badge { position: absolute; top: -8px; right: -10px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: var(--tc-radius-pill);
      background: var(--tc-coral); color: var(--tc-night); font-size: .65rem; font-weight: 700; display: grid; place-items: center; }
    .ic { width: 18px; height: 18px; }
    .shell { flex: 1; }
    .foot { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 2rem 1.5rem; font-size: .85rem;
      border-top: 1px solid color-mix(in srgb, var(--tc-foam) 10%, transparent); color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .foot a { color: var(--tc-crest); text-decoration: none; }
  `],
})
export class StoreLayout {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly t = this.i18n.t;
}
