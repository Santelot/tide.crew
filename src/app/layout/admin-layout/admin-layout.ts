import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideLayoutDashboard, LucidePackage, LucideClipboardList,
  LucideCalendarDays, LucideHandshake, LucideUsers, LucideLogOut, LucideStore,
} from '@lucide/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet,
    LucideLayoutDashboard, LucidePackage, LucideClipboardList,
    LucideCalendarDays, LucideHandshake, LucideUsers, LucideLogOut, LucideStore,
  ],
  template: `
    <div class="admin">
      <aside class="side">
        <a routerLink="/" class="side__brand">TideCrew</a>
        <nav class="side__nav">
          <a routerLink="/admin" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
            <svg lucideLayoutDashboard class="ic"></svg><span>Panel</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="is-active"><svg lucidePackage class="ic"></svg><span>Productos</span></a>
          <a routerLink="/admin/orders" routerLinkActive="is-active"><svg lucideClipboardList class="ic"></svg><span>Órdenes</span></a>
          <a routerLink="/admin/drops" routerLinkActive="is-active"><svg lucideCalendarDays class="ic"></svg><span>Drops</span></a>
          <a routerLink="/admin/sponsors" routerLinkActive="is-active"><svg lucideHandshake class="ic"></svg><span>Patrocinadores</span></a>
          <a routerLink="/admin/teams" routerLinkActive="is-active"><svg lucideUsers class="ic"></svg><span>Equipos</span></a>
          <a routerLink="/admin/customers" routerLinkActive="is-active"><svg lucideUsers class="ic"></svg><span>Clientes</span></a>
        </nav>
        <div class="side__foot">
          <a routerLink="/"><svg lucideStore class="ic"></svg> Ver tienda</a>
          <button type="button" (click)="signOut()"><svg lucideLogOut class="ic"></svg> Salir</button>
        </div>
      </aside>

      <section class="admin__main">
        <header class="admin__top"><span>Administración</span><span class="who">{{ email }}</span></header>
        <div class="admin__content"><router-outlet /></div>
      </section>
    </div>
  `,
  styles: [`
    .admin { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
    .side { display: flex; flex-direction: column; gap: 1rem; padding: 1.2rem 1rem;
      border-right: 1px solid color-mix(in srgb, var(--tc-foam) 10%, transparent);
      background: color-mix(in srgb, var(--tc-undertow) 22%, var(--tc-night)); }
    .side__brand { font-family: var(--tc-font-title); font-size: 1.2rem; text-decoration: none; color: var(--tc-foam); padding: .2rem .3rem .8rem; }
    .side__nav { display: flex; flex-direction: column; gap: .15rem; }
    .side__nav a { display: flex; align-items: center; gap: .6rem; padding: .55rem .6rem; border-radius: var(--tc-radius-sharp);
      text-decoration: none; color: color-mix(in srgb, var(--tc-foam) 80%, transparent); font-size: .92rem; }
    .side__nav a:hover { background: color-mix(in srgb, var(--tc-foam) 6%, transparent); }
    .side__nav a.is-active { background: var(--tc-pacific); color: var(--tc-night); }
    .side__foot { margin-top: auto; display: flex; flex-direction: column; gap: .3rem; }
    .side__foot a, .side__foot button { display: flex; align-items: center; gap: .5rem; background: none; border: none; font: inherit;
      text-decoration: none; padding: .5rem .6rem; cursor: pointer; border-radius: var(--tc-radius-sharp);
      color: color-mix(in srgb, var(--tc-foam) 65%, transparent); }
    .side__foot a:hover, .side__foot button:hover { color: var(--tc-crest); }
    .ic { width: 17px; height: 17px; }
    .admin__main { display: flex; flex-direction: column; min-width: 0; }
    .admin__top { display: flex; justify-content: space-between; padding: 1rem 1.5rem; font-size: .85rem;
      border-bottom: 1px solid color-mix(in srgb, var(--tc-foam) 10%, transparent); color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .admin__content { padding: 1.5rem; }
  `],
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly email = this.auth.user()?.email ?? '';

  async signOut() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
