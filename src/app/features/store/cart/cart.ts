import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../../core/cart.service';
import { CatalogService, mxn } from '../../../core/catalog.service';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1 class="page__title">{{ t('cart.title') }}</h1>

      @if (cart.items().length === 0) {
        <p class="muted">{{ t('cart.empty') }} <a routerLink="/store">Ir a la tienda →</a></p>
      } @else {
        <div class="lines">
          @for (i of cart.items(); track i.variantId) {
            <div class="line">
              <div class="thumb" [style.background-image]="img(i)">
                @if (!img(i)) { <span class="wm">TC</span> }
              </div>
              <div class="info">
                <a [routerLink]="['/product', i.slug]" class="name">{{ name(i) }}</a>
                <span class="muted">{{ i.size || 'Único' }} · {{ mxn(i.unitPriceMxn) }}</span>
              </div>
              <div class="qty">
                <button (click)="cart.setQty(i.variantId, i.qty - 1)" [disabled]="i.qty <= 1" aria-label="menos">−</button>
                <span>{{ i.qty }}</span>
                <button (click)="cart.setQty(i.variantId, i.qty + 1)" [disabled]="i.qty >= i.stock" aria-label="más">+</button>
              </div>
              <span class="lineprice">{{ mxn(i.unitPriceMxn * i.qty) }}</span>
              <button class="rm" (click)="cart.remove(i.variantId)" aria-label="quitar">✕</button>
            </div>
          }
        </div>

        <div class="summary">
          <div class="row"><span>Subtotal</span><strong>{{ mxn(cart.subtotal()) }}</strong></div>
          <p class="muted small">Envío e impuestos se calculan en el pago.</p>
          <a routerLink="/checkout" class="cta">Proceder al pago</a>
          <button class="clear" (click)="cart.clear()">Vaciar carrito</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .muted { color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .muted a { color: var(--tc-crest); text-decoration: none; }
    .small { font-size: .82rem; }
    .lines { display: flex; flex-direction: column; gap: .8rem; margin: 1.5rem 0; }
    .line { display: grid; grid-template-columns: 64px 1fr auto auto auto; gap: 1rem; align-items: center;
      padding-bottom: .8rem; border-bottom: 1px solid color-mix(in srgb, var(--tc-foam) 8%, transparent); }
    .thumb { width: 64px; aspect-ratio: 4 / 5; border-radius: var(--tc-radius-sharp); background-size: cover; background-position: center;
      background-color: color-mix(in srgb, var(--tc-undertow) 40%, var(--tc-night)); display: grid; place-items: center; }
    .wm { font-family: var(--tc-font-title); font-size: .9rem; color: color-mix(in srgb, var(--tc-crest) 40%, transparent); }
    .info { display: flex; flex-direction: column; gap: .2rem; min-width: 0; }
    .name { color: var(--tc-foam); text-decoration: none; font-weight: 600; }
    .name:hover { color: var(--tc-crest); }
    .qty { display: inline-flex; align-items: center; gap: .6rem; }
    .qty button { width: 26px; height: 26px; border-radius: var(--tc-radius-sharp); cursor: pointer; color: var(--tc-foam);
      background: transparent; border: 1px solid color-mix(in srgb, var(--tc-foam) 20%, transparent); font: inherit; }
    .qty button:hover:not(:disabled) { border-color: var(--tc-pacific); }
    .qty button:disabled { opacity: .35; cursor: not-allowed; }
    .lineprice { color: var(--tc-crest); min-width: 5rem; text-align: right; }
    .rm { background: none; border: none; color: color-mix(in srgb, var(--tc-foam) 50%, transparent); cursor: pointer; font-size: 1rem; }
    .rm:hover { color: var(--tc-coral); }
    .summary { max-width: 22rem; margin-left: auto; display: flex; flex-direction: column; gap: .5rem; }
    .summary .row { display: flex; justify-content: space-between; font-size: 1.1rem; }
    .cta { text-align: center; margin-top: .6rem; padding: .9rem; border-radius: var(--tc-radius-pill); text-decoration: none;
      background: var(--tc-pacific); color: var(--tc-night); font-weight: 600; }
    .cta:hover { background: var(--tc-crest); }
    .clear { background: none; border: none; color: color-mix(in srgb, var(--tc-foam) 55%, transparent); cursor: pointer; font: inherit; }
    .clear:hover { color: var(--tc-coral); }
  `],
})
export class Cart {
  protected readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  readonly mxn = mxn;

  name(i: CartItem): string { return this.i18n.lang() === 'en' ? i.nameEn : i.nameEs; }

  img(i: CartItem): string | null {
    return i.imagePath ? 'url(' + this.catalog.publicImageUrl(i.imagePath) + ')' : null;
  }
}
