import { InjectionToken } from '@angular/core';

/** Where a signed-in user without the needed role is sent (inside the current app). */
export const UNAUTHORIZED_ROUTE = new InjectionToken<string>('UNAUTHORIZED_ROUTE', {
  factory: () => '/unauthorized',
});

export const DEFAULT_AUTHENTICATED_ROUTE = new InjectionToken<string>('DEFAULT_AUTHENTICATED_ROUTE', {
  factory: () => '/',
});

/** The change-password screen a user is forced to use while `mustChangePassword` is true (inside the current app). */
export const FORCED_PASSWORD_CHANGE_ROUTE = new InjectionToken<string>('FORCED_PASSWORD_CHANGE_ROUTE', {
  factory: () => '/change-password',
});
