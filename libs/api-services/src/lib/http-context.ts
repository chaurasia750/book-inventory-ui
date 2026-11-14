import { HttpContextToken } from '@angular/common/http';

/**
 * Set on a request whose failure the calling page shows itself (for example the login form's inline error), so the
 * global error interceptor does not also raise a toast.
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
