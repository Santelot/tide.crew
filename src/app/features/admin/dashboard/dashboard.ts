import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
    <h1 class="page__title">Panel</h1>
    <p class="page__note">El puente de mando. Desde aquí gobiernas la tienda.</p>
    <div class="cards">
      @for (c of cards; track c.path) {
        <a class="card" [routerLink]="c.path"><span class="card__t">{{ c.label }}</span><span class="card__d">{{ c.desc }}</span></a>
      }
    </div>
  `,
  styles: [`
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .card { display: grid; gap: .3rem; padding: 1.2rem; border-radius: var(--tc-radius-card); text-decoration: none; color: var(--tc-foam);
      border: 1px solid var(--tc-slate); background: color-mix(in srgb, var(--tc-foam) 3%, transparent); }
    .card:hover { border-color: var(--tc-pacific); }
    .card__t { font-weight: 600; }
    .card__d { font-size: .85rem; color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
  `],
})
export class AdminDashboard {
  protected readonly cards = [
    { path: '/admin/products', label: 'Productos', desc: 'Catálogo, variantes, inventario' },
    { path: '/admin/orders', label: 'Órdenes', desc: 'Cola de pedidos pagados' },
    { path: '/admin/drops', label: 'Drops', desc: 'Calendario de lanzamientos' },
    { path: '/admin/sponsors', label: 'Patrocinadores', desc: 'Muro por niveles' },
    { path: '/admin/teams', label: 'Equipos', desc: 'Programa FIRST' },
    { path: '/admin/customers', label: 'Clientes', desc: 'La tripulación registrada' },
  ];
}
