import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { mxn } from '../../../core/catalog.service';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1 class="page__title">Pago</h1>

      @if (cart.items().length === 0) {
        <p class="muted">No hay nada que pagar. <a routerLink="/store">Ir a la tienda →</a></p>
      } @else {
        <div class="sum">
          @for (i of cart.items(); track i.variantId) {
            <div class="row">
              <span>{{ i.qty }}× {{ i.nameEs }} <small class="muted">· {{ i.size || 'Único' }}</small></span>
              <span>{{ mxn(i.unitPriceMxn * i.qty) }}</span>
            </div>
          }
          <div class="row total"><span>Total</span><strong>{{ mxn(cart.subtotal()) }}</strong></div>
        </div>

        <button class="cta" disabled>Pagar con Stripe</button>
        <p class="muted small">El pago seguro con Stripe es el siguiente paso: aquí se creará la sesión de Checkout y la orden se registrará en el servidor cuando el pago se confirme.</p>
      }
    </section>
  `,
  styles: [`
    .muted { color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .muted a { color: var(--tc-crest); text-decoration: none; }
    .small { font-size: .82rem; max-width: 34rem; }
    .sum { max-width: 28rem; display: flex; flex-direction: column; gap: .5rem; margin: 1.5rem 0; }
    .row { display: flex; justify-content: space-between; gap: 1rem; }
    .row.total { border-top: 1px solid color-mix(in srgb, var(--tc-foam) 12%, transparent); padding-top: .6rem; font-size: 1.15rem; }
    .row.total strong { color: var(--tc-crest); }
    .cta { padding: .9rem 1.8rem; border: none; border-radius: var(--tc-radius-pill); background: var(--tc-pacific); color: var(--tc-night);
      font-weight: 600; cursor: not-allowed; opacity: .5; }
  `],
})
export class Checkout {
  protected readonly cart = inject(CartService);
  readonly mxn = mxn;
}
