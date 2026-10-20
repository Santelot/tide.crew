import { computed, effect, Injectable, signal } from '@angular/core';

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  size: string | null;
  unitPriceMxn: number;
  imagePath: string | null;
  stock: number;
  qty: number;
}

/**
 * Cart lives in localStorage so it works for guests too (no login required to
 * hold items). Logged-in cross-device sync via the cart_items table can come later.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly KEY = 'tc_cart_v1';

  readonly items = signal<CartItem[]>(this.read());
  readonly count = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  readonly subtotal = computed(() => this.items().reduce((s, i) => s + i.qty * i.unitPriceMxn, 0));

  constructor() {
    effect(() => this.write(this.items()));
  }

  add(line: Omit<CartItem, 'qty'>, qty = 1): void {
    const items = [...this.items()];
    const idx = items.findIndex((i) => i.variantId === line.variantId);
    const cap = line.stock || Number.MAX_SAFE_INTEGER;
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...line, qty: Math.min(items[idx].qty + qty, cap) };
    } else {
      items.push({ ...line, qty: Math.min(qty, cap) });
    }
    this.items.set(items);
  }

  setQty(variantId: string, qty: number): void {
    this.items.set(
      this.items().map((i) =>
        i.variantId === variantId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || qty)) } : i,
      ),
    );
  }

  remove(variantId: string): void {
    this.items.set(this.items().filter((i) => i.variantId !== variantId));
  }

  clear(): void {
    this.items.set([]);
  }

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: CartItem[]): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — cart stays in memory for this session */
    }
  }
}
