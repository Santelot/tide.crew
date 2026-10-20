import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService, mxn, type Product as ProductRow, type ProductVariant } from '../../../core/catalog.service';
import { CartService } from '../../../core/cart.service';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'app-product',
  imports: [RouterLink],
  template: `
    <section class="page">
      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (!product()) {
        <h1 class="page__title">Producto no encontrado</h1>
        <p class="muted">Quizá la marea se lo llevó. <a routerLink="/store">Volver a la tienda</a></p>
      } @else {
        <div class="detail">
          <div class="media" [style.background-image]="img()">
            @if (!img()) { <span class="wm">TC</span> }
          </div>
          <div class="info">
            <h1 class="page__title">{{ name() }}</h1>
            <p class="price">{{ mxn(price()) }}</p>
            @if (desc()) { <p class="desc">{{ desc() }}</p> }

            @if (variants().length) {
              <div class="sizes">
                @for (v of variants(); track v.id) {
                  <button class="size" [class.sel]="selected()?.id === v.id" [disabled]="v.stock === 0" (click)="pick(v)">
                    {{ v.size || 'Único' }}@if (v.stock === 0) { <small> · agotado</small> }
                  </button>
                }
              </div>
            }

            @if (variants().length === 0) {
              <button class="cta" disabled>Aún no disponible</button>
            } @else if (!canBuy()) {
              <button class="cta" disabled>Agotado</button>
            } @else {
              <button class="cta" (click)="addToCart()">Agregar al carrito</button>
            }

            @if (added()) { <p class="added">Agregado al carrito. <a routerLink="/cart">Ver carrito →</a></p> }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .muted { color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.5rem; align-items: start; }
    @media (max-width: 720px) { .detail { grid-template-columns: 1fr; } }
    .media { aspect-ratio: 4 / 5; border-radius: var(--tc-radius-card); background-size: cover; background-position: center;
      background-color: color-mix(in srgb, var(--tc-undertow) 40%, var(--tc-night));
      display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--tc-foam) 8%, transparent); }
    .wm { font-family: var(--tc-font-title); font-size: 3rem; color: color-mix(in srgb, var(--tc-crest) 40%, transparent); }
    .price { color: var(--tc-crest); font-size: 1.3rem; margin: .2rem 0 1rem; }
    .desc { color: color-mix(in srgb, var(--tc-foam) 78%, transparent); line-height: 1.6; }
    .sizes { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.2rem 0; }
    .size { padding: .5rem .9rem; border-radius: var(--tc-radius-sharp); background: transparent; color: var(--tc-foam); cursor: pointer;
      border: 1px solid color-mix(in srgb, var(--tc-foam) 22%, transparent); font: inherit; }
    .size:hover:not(:disabled) { border-color: var(--tc-pacific); }
    .size.sel { background: var(--tc-pacific); color: var(--tc-night); border-color: var(--tc-pacific); }
    .size:disabled { opacity: .4; cursor: not-allowed; }
    .size small { opacity: .7; }
    .cta { margin-top: 1rem; padding: .9rem 1.8rem; border: none; border-radius: var(--tc-radius-pill);
      background: var(--tc-pacific); color: var(--tc-night); font-weight: 600; cursor: pointer; }
    .cta:hover:not(:disabled) { background: var(--tc-crest); }
    .cta:disabled { opacity: .5; cursor: not-allowed; }
    .added { margin-top: .8rem; color: var(--tc-success); }
    .added a { color: var(--tc-crest); text-decoration: none; }
  `],
})
export class Product {
  private readonly catalog = inject(CatalogService);
  private readonly i18n = inject(I18nService);
  private readonly cart = inject(CartService);

  readonly slug = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly product = signal<ProductRow | null>(null);
  protected readonly selected = signal<ProductVariant | null>(null);
  protected readonly added = signal(false);
  readonly mxn = mxn;

  protected readonly canBuy = computed(() => {
    const v = this.selected();
    return !!v && v.stock > 0;
  });

  constructor() {
    effect(() => { this.load(this.slug()); });
  }

  async load(slug: string): Promise<void> {
    this.loading.set(true);
    this.added.set(false);
    try {
      const p = await this.catalog.getBySlug(slug);
      this.product.set(p);
      this.selected.set((p?.product_variants ?? []).find((v) => v.stock > 0) ?? null);
    } catch {
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  variants(): ProductVariant[] { return this.product()?.product_variants ?? []; }

  pick(v: ProductVariant): void { this.selected.set(v); this.added.set(false); }

  name(): string {
    const p = this.product();
    return p ? (this.i18n.lang() === 'en' ? p.name_en : p.name_es) : '';
  }

  desc(): string {
    const p = this.product();
    return (this.i18n.lang() === 'en' ? p?.description_en : p?.description_es) ?? '';
  }

  price(): number {
    const p = this.product();
    if (!p) return 0;
    return this.selected()?.price_mxn ?? p.base_price_mxn;
  }

  img(): string | null {
    const p = this.product();
    if (!p) return null;
    const primary = (p.product_images ?? []).find((i) => i.is_primary) ?? (p.product_images ?? [])[0];
    return primary ? 'url(' + this.catalog.publicImageUrl(primary.path) + ')' : null;
  }

  addToCart(): void {
    const p = this.product();
    const v = this.selected();
    if (!p || !v) return;
    const primary = (p.product_images ?? []).find((i) => i.is_primary) ?? (p.product_images ?? [])[0];
    this.cart.add({
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      nameEs: p.name_es,
      nameEn: p.name_en,
      size: v.size,
      unitPriceMxn: v.price_mxn ?? p.base_price_mxn,
      imagePath: primary?.path ?? null,
      stock: v.stock,
    });
    this.added.set(true);
  }
}
