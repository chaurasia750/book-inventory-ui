/** Neutral placeholder brand; the real name/logo/colours arrive later (only this constant and the theme tokens change). */
export const APP_NAME = 'Book Inventory';
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Root URLs of each deployed app, relative to the shared origin.
 * These match the base-href each app is built with (single-port dev
 * server and IIS sub-application deployment both mount apps here).
 * Override at the call site if an app is hosted on a separate origin.
 */
export const APP_URLS = {
  PUBLIC: '/',
  ADMIN: '/admin',
  MEMBER: '/member',
} as const;

/**
 * Feature switch for navigation. Screens of a module are shown only when its new API exists and its adaptation
 * plan is done; until then the code stays in the repository but is not linked. Flip a flag to bring a module back.
 */
export const FEATURES = {
  /** Sign-in, password flows, profile, user management (the `iam` module). */
  iam: true,
} as const;
