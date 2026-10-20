import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialized;
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!auth.profile()) await auth.loadProfile();
  return auth.isAdmin() ? true : router.createUrlTree(['/']);
};
