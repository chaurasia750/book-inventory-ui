import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@org/auth';

/**
 * Lets authenticated users in. Anyone else is sent to the login page with a hard browser navigation (login lives in a
 * different Angular bundle, so a router navigation cannot reach it). The session is already restored at start-up
 * (`AuthService.initializeSession`), so this check is synchronous.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.redirectToLogin(window.location.href);
  return false;
};
