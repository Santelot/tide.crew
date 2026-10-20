import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';

/**
 * While the marketplace is closed (environment.storeOpen === false) the store
 * routes send visitors to /FIRST. Admins still get through so the team can keep
 * building and testing the store on the live domain.
 */
const gate = async () => {
  if (environment.storeOpen) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialized;
  if (auth.isLoggedIn() && !auth.profile()) await auth.loadProfile();
  return auth.isAdmin() ? true : router.createUrlTree(['/FIRST']);
};

export const storeOpenGuard: CanActivateFn = () => gate();
export const storeOpenChildGuard: CanActivateChildFn = () => gate();
