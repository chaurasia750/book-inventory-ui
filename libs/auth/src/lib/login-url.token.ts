import { InjectionToken } from '@angular/core';

/**
 * Where unauthenticated users are sent. Login lives in the public-site app, so `admin` and `member` reach it with a
 * hard browser navigation (a different Angular bundle). '/login' works when the API serves all apps from one origin;
 * in development each app has its own port, so the app config provides the absolute dev URL.
 */
export const LOGIN_URL = new InjectionToken<string>('LOGIN_URL', {
  factory: () => '/login',
});
