import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService, mxn, Product } from '../../../core/catalog.service';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1 class="page__title">Tienda</h1>
      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (error()) {
        <p class="muted">{{ error() }}</p>
      } @else if (products().length === 0) {
        <p class="muted">Pronto zarpamos. Aún no hay productos publicados.</p>
      } @else {
        <div class="grid">
          @for (p of products(); track p.id) {
            <a class="card" [routerLink]="['/product', p.slug]">
              <div class="thumb" [style.background-image]="img(p)">
                @if (!img(p)) { <span class="wm">TC</span> }
              </div>
              <div class="meta">
                <span class="name">{{ name(p) }}</span>
                <span class="price">{{ mxn(p.base_price_mxn) }}</span>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .muted { color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1.4rem; margin-top: 1.5rem; }
    .card { text-decoration: none; color: var(--tc-foam); display: grid; gap: .6rem; }
    .thumb { aspect-ratio: 4 / 5; border-radius: var(--tc-radius-card); background-size: cover; background-position: center;
      background-color: color-mix(in srgb, var(--tc-undertow) 40%, var(--tc-night));
      display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--tc-foam) 8%, transparent); transition: border-color .15s; }
    .card:hover .thumb { border-color: var(--tc-pacific); }
    .wm { font-family: var(--tc-font-title); font-size: 2rem; color: color-mix(in srgb, var(--tc-crest) 40%, transparent); }
    .meta { display: flex; justify-content: space-between; gap: .5rem; }
    .name { font-weight: 600; }
    .price { color: var(--tc-crest); }
  `],
})
export class Catalog {
  private readonly catalog = inject(CatalogService);
  private readonly i18n = inject(I18nService);

  protected readonly loading = signal(true);
  protected readonly products = signal<Product[]>([]);
  protected readonly error = signal<string | null>(null);
  readonly mxn = mxn;

  constructor() { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.products.set(await this.catalog.listActive());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la tienda.');
    } finally {
      this.loading.set(false);
    }
  }

  name(p: Product): string { return this.i18n.lang() === 'en' ? p.name_en : p.name_es; }

  img(p: Product): string | null {
    const imgs = p.product_images ?? [];
    const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
    return primary ? 'url(' + this.catalog.publicImageUrl(primary.path) + ')' : null;
  }
}
