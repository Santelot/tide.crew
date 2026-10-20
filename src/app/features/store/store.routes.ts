import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const STORE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'store', loadComponent: () => import('./catalog/catalog').then((m) => m.Catalog) },
  { path: 'product/:slug', loadComponent: () => import('./product/product').then((m) => m.Product) },
  { path: 'cart', loadComponent: () => import('./cart/cart').then((m) => m.Cart) },
  { path: 'checkout', loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout) },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./account/account').then((m) => m.Account) },
];
