import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboard) },
  { path: 'products', loadComponent: () => import('./products/products').then((m) => m.AdminProducts) },
  { path: 'orders', loadComponent: () => import('./orders/orders').then((m) => m.AdminOrders) },
  { path: 'drops', loadComponent: () => import('./drops/drops').then((m) => m.AdminDrops) },
  { path: 'sponsors', loadComponent: () => import('./sponsors/sponsors').then((m) => m.AdminSponsors) },
  { path: 'teams', loadComponent: () => import('./teams/teams').then((m) => m.AdminTeams) },
  { path: 'customers', loadComponent: () => import('./customers/customers').then((m) => m.AdminCustomers) },
];
