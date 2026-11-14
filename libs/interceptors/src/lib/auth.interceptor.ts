import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '@org/api-services';
import { AuthService } from '@org/auth';

/** Endpoints where a 401 is an answer, not an expired session (wrong password, no cookie, ...). */
const AUTH_ENDPOINT_RE = /\/auth\/(login|refresh|logout|forgot-password|reset-password|me)(\?|$)/;

/** The header the API requires on a state-changing call that relies on the session cookies (a second line against CSRF). */
const REQUESTED_WITH = { 'X-Requested-With': 'XMLHttpRequest' };

/**
 * Marks calls to our own API only: the session travels in the HttpOnly cookies, so there is no token to add, just the
 * anti-CSRF header. On a 401 (the short-lived access cookie ran out) it refreshes the session once (concurrent requests
 * share the same refresh) and retries; if that fails the user goes back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = inject(API_BASE_URL);

  if (!isApiRequest(req, apiBaseUrl)) {
    return next(req);
  }

  const send = () => next(req.clone({ withCredentials: true, setHeaders: REQUESTED_WITH }));

  return send().pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || AUTH_ENDPOINT_RE.test(req.url)) {
        return throwError(() => error);
      }

      if (!auth.shouldAutoRefresh()) {
        auth.expireSessionSilently();
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(() => send()),
        catchError((refreshError: unknown) => {
          auth.expireSessionSilently();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function isApiRequest(req: HttpRequest<unknown>, apiBaseUrl: string): boolean {
  return apiBaseUrl !== '' && req.url.startsWith(apiBaseUrl);
}
