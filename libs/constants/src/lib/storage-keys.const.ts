/**
 * Browser storage keys. Nothing secret is ever stored: the access token lives in memory and the refresh token in an
 * HttpOnly cookie. SESSION_HINT is a non-secret flag that only tells the app whether a session restore is worthwhile.
 */
export const STORAGE_KEYS = {
  THEME: 'app_theme',
  SESSION_HINT: 'book_inventory.session',
} as const;
