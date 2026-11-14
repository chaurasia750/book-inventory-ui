import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@org/auth';
import { AppRole, Role } from '@org/shared-models';
import { UNAUTHORIZED_ROUTE } from './route-tokens';

/** Older pages: allowed buckets `admin` (all staff roles) / `member`. */
export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      auth.redirectToLogin(window.location.href);
      return false;
    }

    return allowedRoles.some((role) => auth.hasRole(role)) || router.parseUrl(inject(UNAUTHORIZED_ROUTE));
  };
}

/** Exact roles, e.g. `appRoleGuard(['SUPER_ADMIN'])` for user management. */
export function appRoleGuard(allowedRoles: AppRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      auth.redirectToLogin(window.location.href);
      return false;
    }

    return auth.hasAppRole(...allowedRoles) || router.parseUrl(inject(UNAUTHORIZED_ROUTE));
  };
}
