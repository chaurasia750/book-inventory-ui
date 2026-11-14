import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@org/auth';
import { FORCED_PASSWORD_CHANGE_ROUTE } from './route-tokens';

/**
 * While the server says the password must be changed, every route except the change-password screen itself sends the
 * user there. (The server enforces the same rule on the API; this only keeps the UI in step with it.)
 */
export const mustChangePasswordGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const forcedRoute = inject(FORCED_PASSWORD_CHANGE_ROUTE);

  if (auth.mustChangePassword() && !state.url.startsWith(forcedRoute)) {
    return router.parseUrl(forcedRoute);
  }

  return true;
};
