import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Category {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  position: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  path: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_mxn: number | null;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  description_en: string | null;
  category_id: string;
  drop_id: string | null;
  base_price_mxn: number;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, 'name_es' | 'name_en'> | null;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
}

export interface NewProduct {
  slug: string;
  name_es: string;
  name_en: string;
  description_es?: string | null;
  description_en?: string | null;
  category_id: string;
  drop_id?: string | null;
  base_price_mxn: number;
  status?: ProductStatus;
  featured?: boolean;
}

export interface NewVariant {
  product_id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  price_mxn?: number | null;
  stock: number;
}

/** MXN currency, the way it reads in Mexico. */
export const mxn = (n: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0);

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly sb = inject(SupabaseService).client;

  // ---------- public store ----------

  /** Active products for the storefront grid (RLS hides drafts from anon). */
  async listActive(): Promise<Product[]> {
    const { data, error } = await this.sb
      .from('products')
      .select('id, slug, name_es, name_en, base_price_mxn, featured, status, product_images(path, is_primary, position)')
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  }

  /** One product by slug, with variants + images. Anon only sees it if active. */
  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.sb
      .from('products')
      .select('*, categories(name_es, name_en), product_variants(*), product_images(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  }

  /** Public URL for an image stored in the product-images bucket. */
  publicImageUrl(path: string): string {
    return this.sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }

  // ---------- admin ----------

  /** Every product (any status) for the admin table. Requires is_admin via RLS. */
  async listAll(): Promise<Product[]> {
    const { data, error } = await this.sb
      .from('products')
      .select('*, categories(name_es, name_en), product_variants(id, product_id, size, color, sku, price_mxn, stock)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.sb.from('categories').select('*').order('position');
    if (error) throw error;
    return (data ?? []) as Category[];
  }

  async createCategory(input: { slug: string; name_es: string; name_en: string }): Promise<Category> {
    const { data, error } = await this.sb.from('categories').insert(input).select().single();
    if (error) throw error;
    return data as Category;
  }

  async createProduct(input: NewProduct): Promise<Product> {
    const { data, error } = await this.sb.from('products').insert(input).select().single();
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, patch: Partial<NewProduct>): Promise<void> {
    const { error } = await this.sb.from('products').update(patch).eq('id', id);
    if (error) throw error;
  }

  async addVariant(input: NewVariant): Promise<ProductVariant> {
    const { data, error } = await this.sb.from('product_variants').insert(input).select().single();
    if (error) throw error;
    return data as ProductVariant;
  }

  async deleteVariant(id: string): Promise<void> {
    const { error } = await this.sb.from('product_variants').delete().eq('id', id);
    if (error) throw error;
  }
}
