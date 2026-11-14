import { InjectionToken } from '@angular/core';

/**
 * Base URL prepended to every relative request made through ApiService
 * (and AuthService). Each app provides this from its own environment file
 * (apps/<app>/src/environments/environment*.ts) so API calls are
 * environment-aware (dev/staging/production) without touching app code.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '',
});
