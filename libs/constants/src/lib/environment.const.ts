export interface AppEnvironment {
  production: boolean;
  /** Base URL of the versioned API, without a trailing slash. */
  apiUrl: string;
  /** Absolute URL of the login page; only needed when the apps run on separate dev ports. */
  loginUrl?: string;
}

/**
 * Single source of truth for per-mode API config, shared by all three apps.
 * Each app's src/environments/environment.ts (and .production.ts/.staging.ts)
 * just re-exports one of these - change the value HERE once and every app
 * picks it up, instead of editing the same apiUrl in three places.
 *
 * In development each app runs on its own dev server (4200/4201/4202) and proxies `/api` to the API (proxy.conf.json), so the
 * browser stays on one origin and the SameSite=Strict refresh cookie is sent. In Staging and Production the API serves these Angular apps from its own origin, so calls stay same-origin
 * under the API's `/api/v1` prefix and the refresh cookie is same-site.
 */
export const DEV_ENVIRONMENT: AppEnvironment = {
  production: false,
  apiUrl: '/api/v1',
  loginUrl: 'http://localhost:4200/login',
};

export const STAGING_ENVIRONMENT: AppEnvironment = {
  production: false,
  apiUrl: '/api/v1',
};

export const PRODUCTION_ENVIRONMENT: AppEnvironment = {
  production: true,
  apiUrl: '/api/v1',
};
