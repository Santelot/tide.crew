import { Component, computed, inject, signal } from '@angular/core';
import { CatalogService, Category, mxn, Product, ProductStatus } from '../../../core/catalog.service';

@Component({
  selector: 'app-admin-products',
  template: `
    <h1 class="page__title">Productos</h1>

    @if (error()) { <p class="err">{{ error() }}</p> }

    @if (needCategory()) {
      <div class="card">
        <h3>Crea tu primera categoría</h3>
        <p class="muted">Cada producto pertenece a una categoría. Crea una para empezar.</p>
        <div class="row">
          <input placeholder="slug (ej. camisetas)" [value]="cSlug()" (input)="cSlug.set(str($event))" />
          <input placeholder="Nombre (ES)" [value]="cNameEs()" (input)="cNameEs.set(str($event))" />
          <input placeholder="Name (EN)" [value]="cNameEn()" (input)="cNameEn.set(str($event))" />
          <button class="btn" (click)="createCategory()" [disabled]="saving()">Crear</button>
        </div>
      </div>
    } @else {
      <div class="bar">
        <button class="btn" (click)="openCreate()">+ Nuevo producto</button>
        <button class="btn ghost" (click)="showCatForm.set(!showCatForm())">{{ showCatForm() ? 'Cerrar categorías' : 'Categorías' }}</button>
      </div>

      @if (showCatForm()) {
        <div class="card">
          <h3>Categorías</h3>
          @if (categories().length) {
            <div class="chips">
              @for (c of categories(); track c.id) { <span class="chip">{{ c.name_es }}<small>/{{ c.slug }}</small></span> }
            </div>
          }
          <div class="row">
            <input placeholder="slug (ej. gorras)" [value]="cSlug()" (input)="cSlug.set(str($event))" />
            <input placeholder="Nombre (ES)" [value]="cNameEs()" (input)="cNameEs.set(str($event))" />
            <input placeholder="Name (EN)" [value]="cNameEn()" (input)="cNameEn.set(str($event))" />
            <button class="btn" (click)="createCategory()" [disabled]="saving()">Añadir</button>
          </div>
        </div>
      }
    }

    @if (showForm()) {
      <div class="card">
        <h3>{{ editingId() ? 'Editar producto' : 'Nuevo producto' }}</h3>
        <div class="grid2">
          <label>Slug<input [value]="fSlug()" (input)="fSlug.set(str($event))" placeholder="stingy-tee" /></label>
          <label>Precio base (MXN)<input type="number" [value]="fPrice() ?? ''" (input)="fPrice.set(num($event))" /></label>
          <label>Nombre (ES)<input [value]="fNameEs()" (input)="fNameEs.set(str($event))" /></label>
          <label>Name (EN)<input [value]="fNameEn()" (input)="fNameEn.set(str($event))" /></label>
          <label>Categoría
            <select [value]="fCategory()" (change)="fCategory.set(str($event))">
              @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name_es }}</option> }
            </select>
          </label>
          <label>Estado
            <select [value]="fStatus()" (change)="fStatus.set(asStatus($event))">
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
          <label class="full">Descripción (ES)<textarea rows="3" [value]="fDescEs()" (input)="fDescEs.set(str($event))"></textarea></label>
          <label class="chk"><input type="checkbox" [checked]="fFeatured()" (change)="fFeatured.set(checked($event))" /> Destacado</label>
          @if (!editingId()) {
            <label class="full">Stock inicial <small class="hint">crea una variante "Único" con este stock; añade tallas después en Variantes</small>
              <input type="number" [value]="fStock() ?? ''" (input)="fStock.set(num($event))" placeholder="ej. 20" />
            </label>
          }
        </div>
        <div class="actions">
          <button class="btn" (click)="saveProduct()" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
          <button class="btn ghost" (click)="showForm.set(false)">Cancelar</button>
        </div>
      </div>
    }

    @if (loading()) {
      <p class="muted">Cargando…</p>
    } @else if (products().length === 0) {
      <p class="muted">Aún no hay productos. Crea el primero.</p>
    } @else {
      <table class="tbl">
        <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          @for (p of products(); track p.id) {
            <tr>
              <td><strong>{{ p.name_es }}</strong><span class="slug">/{{ p.slug }}</span></td>
              <td>{{ p.categories?.name_es ?? '—' }}</td>
              <td>{{ mxn(p.base_price_mxn) }}</td>
              <td>{{ totalStock(p) }}</td>
              <td>
                <select class="st st--{{ p.status }}" [value]="p.status" (change)="setStatus(p, asStatus($event))">
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </td>
              <td class="rowact">
                <button class="link" (click)="openEdit(p)">Editar</button>
                @if ((p.product_variants ?? []).length === 0) {
                  <button class="link warn" (click)="toggleExpand(p.id)">+ Stock</button>
                } @else {
                  <button class="link" (click)="toggleExpand(p.id)">Variantes ({{ (p.product_variants ?? []).length }})</button>
                }
              </td>
            </tr>
            @if (expandedId() === p.id) {
              <tr class="vrow"><td colspan="6">
                <div class="variants">
                  @for (v of p.product_variants ?? []; track v.id) {
                    <div class="vitem">
                      <span class="vsize">{{ v.size || 'Único' }}</span>
                      <span class="muted">{{ v.sku || 'sin SKU' }}</span>
                      <span>{{ v.price_mxn != null ? mxn(v.price_mxn) : mxn(p.base_price_mxn) }}</span>
                      <span>stock: {{ v.stock }}</span>
                      <button class="link danger" (click)="removeVariant(v.id)">Eliminar</button>
                    </div>
                  } @empty { <p class="muted">Sin variantes. Cada talla es una variante con su propio stock — añade al menos una para poder vender.</p> }
                  <div class="row addv">
                    <input placeholder="Talla (S/M/L)" [value]="vSize()" (input)="vSize.set(str($event))" />
                    <input type="number" placeholder="Stock" [value]="vStock() ?? ''" (input)="vStock.set(num($event))" />
                    <input type="number" placeholder="Precio (opc.)" [value]="vPrice() ?? ''" (input)="vPrice.set(num($event))" />
                    <input placeholder="SKU (opc.)" [value]="vSku()" (input)="vSku.set(str($event))" />
                    <button class="btn sm" (click)="addVariant(p)" [disabled]="saving()">Añadir</button>
                  </div>
                </div>
              </td></tr>
            }
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    .err { color: var(--tc-coral); }
    .muted { color: color-mix(in srgb, var(--tc-foam) 60%, transparent); }
    .bar { margin: 1rem 0; }
    .btn { padding: .55rem 1rem; border: none; border-radius: var(--tc-radius-pill); background: var(--tc-pacific); color: var(--tc-night); font-weight: 600; cursor: pointer; }
    .btn:hover:not(:disabled) { background: var(--tc-crest); } .btn:disabled { opacity: .6; }
    .btn.ghost { background: transparent; color: var(--tc-foam); border: 1px solid var(--tc-slate); }
    .btn.sm { padding: .4rem .8rem; font-size: .85rem; }
    .card { border: 1px solid var(--tc-slate); border-radius: var(--tc-radius-card); padding: 1.2rem; margin: 1rem 0;
      background: color-mix(in srgb, var(--tc-foam) 3%, transparent); }
    .card h3 { margin: 0 0 .3rem; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; margin: 1rem 0; }
    label { display: grid; gap: .3rem; font-size: .82rem; color: color-mix(in srgb, var(--tc-foam) 70%, transparent); }
    label.full { grid-column: 1 / -1; } label.chk { flex-direction: row; align-items: center; display: flex; gap: .5rem; }
    input, select, textarea { padding: .5rem .6rem; border-radius: var(--tc-radius-sharp); background: var(--tc-night); color: var(--tc-foam);
      font: inherit; border: 1px solid color-mix(in srgb, var(--tc-foam) 18%, transparent); }
    input:focus, select:focus, textarea:focus { outline: 2px solid var(--tc-pacific); border-color: transparent; }
    .actions { display: flex; gap: .6rem; }
    .row { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; }
    .tbl { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: .92rem; }
    .tbl th { text-align: left; padding: .5rem .6rem; color: var(--tc-crest); border-bottom: 1px solid var(--tc-slate); font-weight: 600; }
    .tbl td { padding: .55rem .6rem; border-bottom: 1px solid color-mix(in srgb, var(--tc-foam) 8%, transparent); vertical-align: middle; }
    .slug { color: color-mix(in srgb, var(--tc-foam) 50%, transparent); margin-left: .5rem; font-size: .8rem; }
    .rowact { display: flex; gap: .8rem; }
    .link { background: none; border: none; color: var(--tc-crest); cursor: pointer; font: inherit; padding: 0; }
    .link:hover { text-decoration: underline; } .link.danger { color: var(--tc-coral); }
    .st { padding: .25rem .4rem; border-radius: var(--tc-radius-sharp); font-size: .82rem; }
    .st--active { border-color: var(--tc-success); color: var(--tc-success); }
    .st--draft { color: color-mix(in srgb, var(--tc-foam) 70%, transparent); }
    .st--archived { color: color-mix(in srgb, var(--tc-foam) 45%, transparent); }
    .vrow td { background: color-mix(in srgb, var(--tc-undertow) 18%, transparent); }
    .variants { display: flex; flex-direction: column; gap: .5rem; padding: .4rem 0; }
    .vitem { display: flex; gap: 1.2rem; align-items: center; font-size: .88rem; }
    .vsize { min-width: 3rem; font-weight: 600; }
    .addv input { max-width: 9rem; }
    .chips { display: flex; flex-wrap: wrap; gap: .5rem; margin: .2rem 0 1rem; }
    .chip { display: inline-flex; gap: .35rem; align-items: baseline; padding: .3rem .65rem; border-radius: var(--tc-radius-pill);
      background: color-mix(in srgb, var(--tc-pacific) 18%, transparent); font-size: .85rem; }
    .chip small { color: color-mix(in srgb, var(--tc-foam) 50%, transparent); }
    .link.warn { color: var(--tc-coral); }
    .hint { display: block; font-weight: 400; color: color-mix(in srgb, var(--tc-foam) 45%, transparent); }
  `],
})
export class AdminProducts {
  private readonly catalog = inject(CatalogService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly needCategory = computed(() => this.categories().length === 0);

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly fSlug = signal('');
  protected readonly fNameEs = signal('');
  protected readonly fNameEn = signal('');
  protected readonly fDescEs = signal('');
  protected readonly fPrice = signal<number | null>(null);
  protected readonly fCategory = signal('');
  protected readonly fStatus = signal<ProductStatus>('draft');
  protected readonly fFeatured = signal(false);
  protected readonly fStock = signal<number | null>(null);

  protected readonly cSlug = signal('');
  protected readonly cNameEs = signal('');
  protected readonly cNameEn = signal('');
  protected readonly showCatForm = signal(false);

  protected readonly expandedId = signal<string | null>(null);
  protected readonly vSize = signal('');
  protected readonly vStock = signal<number | null>(null);
  protected readonly vPrice = signal<number | null>(null);
  protected readonly vSku = signal('');

  readonly mxn = mxn;

  constructor() { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [cats, prods] = await Promise.all([this.catalog.listCategories(), this.catalog.listAll()]);
      this.categories.set(cats);
      this.products.set(prods);
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  totalStock(p: Product): number {
    return (p.product_variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.fSlug.set(''); this.fNameEs.set(''); this.fNameEn.set(''); this.fDescEs.set('');
    this.fPrice.set(null); this.fCategory.set(this.categories()[0]?.id ?? '');
    this.fStatus.set('draft'); this.fFeatured.set(false); this.fStock.set(null);
    this.showForm.set(true);
  }

  openEdit(p: Product): void {
    this.editingId.set(p.id);
    this.fSlug.set(p.slug); this.fNameEs.set(p.name_es); this.fNameEn.set(p.name_en);
    this.fDescEs.set(p.description_es ?? '');
    this.fPrice.set(p.base_price_mxn); this.fCategory.set(p.category_id);
    this.fStatus.set(p.status); this.fFeatured.set(p.featured);
    this.showForm.set(true);
  }

  async saveProduct(): Promise<void> {
    if (!this.fSlug() || !this.fNameEs() || !this.fNameEn() || this.fPrice() == null || !this.fCategory()) {
      this.error.set('Faltan campos obligatorios (slug, nombres, precio, categoría).');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const payload = {
      slug: this.fSlug().trim(),
      name_es: this.fNameEs().trim(),
      name_en: this.fNameEn().trim(),
      description_es: this.fDescEs().trim() || null,
      base_price_mxn: Number(this.fPrice()),
      category_id: this.fCategory(),
      status: this.fStatus(),
      featured: this.fFeatured(),
    };
    try {
      const id = this.editingId();
      if (id) {
        await this.catalog.updateProduct(id, payload);
      } else {
        const created = await this.catalog.createProduct(payload);
        const stock = this.fStock();
        if (stock != null && stock > 0) {
          await this.catalog.addVariant({ product_id: created.id, size: null, stock: Number(stock) });
        }
      }
      this.showForm.set(false);
      await this.load();
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.saving.set(false);
    }
  }

  async setStatus(p: Product, status: ProductStatus): Promise<void> {
    try { await this.catalog.updateProduct(p.id, { status }); await this.load(); }
    catch (e) { this.error.set(this.msg(e)); }
  }

  async createCategory(): Promise<void> {
    if (!this.cSlug() || !this.cNameEs() || !this.cNameEn()) { this.error.set('Completa la categoría.'); return; }
    this.saving.set(true);
    try {
      await this.catalog.createCategory({ slug: this.cSlug().trim(), name_es: this.cNameEs().trim(), name_en: this.cNameEn().trim() });
      this.cSlug.set(''); this.cNameEs.set(''); this.cNameEn.set('');
      await this.load();
    } catch (e) { this.error.set(this.msg(e)); }
    finally { this.saving.set(false); }
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
    this.vSize.set(''); this.vStock.set(null); this.vPrice.set(null); this.vSku.set('');
  }

  async addVariant(p: Product): Promise<void> {
    if (this.vStock() == null) { this.error.set('Indica el stock de la variante.'); return; }
    this.saving.set(true);
    try {
      await this.catalog.addVariant({
        product_id: p.id,
        size: this.vSize().trim() || null,
        sku: this.vSku().trim() || null,
        price_mxn: this.vPrice() != null ? Number(this.vPrice()) : null,
        stock: Number(this.vStock()),
      });
      this.vSize.set(''); this.vStock.set(null); this.vPrice.set(null); this.vSku.set('');
      await this.load();
    } catch (e) { this.error.set(this.msg(e)); }
    finally { this.saving.set(false); }
  }

  async removeVariant(id: string): Promise<void> {
    try { await this.catalog.deleteVariant(id); await this.load(); }
    catch (e) { this.error.set(this.msg(e)); }
  }

  // template input helpers
  str(e: Event): string { return (e.target as HTMLInputElement).value; }
  num(e: Event): number | null { const v = (e.target as HTMLInputElement).value; return v === '' ? null : Number(v); }
  checked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  asStatus(e: Event): ProductStatus { return (e.target as HTMLSelectElement).value as ProductStatus; }

  private msg(e: unknown): string { return e instanceof Error ? e.message : 'Error inesperado.'; }
}
