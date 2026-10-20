import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

// Keeps signed-in users off /login.
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialized;
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : true;
};
