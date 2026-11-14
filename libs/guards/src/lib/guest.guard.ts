import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@org/auth';
import { DEFAULT_AUTHENTICATED_ROUTE } from './route-tokens';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.parseUrl(inject(DEFAULT_AUTHENTICATED_ROUTE));
  }

  return true;
};
