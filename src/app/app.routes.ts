import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { storeOpenChildGuard } from './core/guards/store-open.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  // While the marketplace is closed, the root lands on the team page.
  ...(environment.storeOpen ? [] : [{ path: '', pathMatch: 'full' as const, redirectTo: 'FIRST' }]),

  // Crew & FIRST — the team landing and the season/challenge hub.
  {
    path: '',
    loadComponent: () => import('./layout/crew-layout/crew-layout').then((m) => m.CrewLayout),
    loadChildren: () => import('./features/crew/crew.routes').then((m) => m.CREW_ROUTES),
  },

  // Public store under the store shell (gated until environment.storeOpen).
  {
    path: '',
    loadComponent: () => import('./layout/store-layout/store-layout').then((m) => m.StoreLayout),
    canActivateChild: [storeOpenChildGuard],
    loadChildren: () => import('./features/store/store.routes').then((m) => m.STORE_ROUTES),
  },

  // Shared login / signup.
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  // Sealed admin portal — guarded here AND by RLS at the data layer.
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  { path: '**', redirectTo: environment.storeOpen ? '' : 'FIRST' },
];
