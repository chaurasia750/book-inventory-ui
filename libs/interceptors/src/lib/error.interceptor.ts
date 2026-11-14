import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, take, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@org/api-services';
import { ToastService } from '@org/ui';
import { messageForError$ } from './error-message';

/**
 * Shows a toast with the catalogue text for any failed API call (see {@link messageForError$}). 401 is left to the
 * auth interceptor, and a request marked with SKIP_ERROR_TOAST is handled by the page itself (inline message).
 * Responses are passed through untouched: the API has no response envelope.
 *
 * TranslateService is resolved lazily, only when an error actually happens: its translation loader uses HttpClient,
 * so injecting it while the interceptor chain is being built would be a circular dependency (NG0200). The message is
 * resolved with `get()`, which waits for the catalogue, because errors can arrive while the app is still starting.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 && !req.context.get(SKIP_ERROR_TOAST)) {
        messageForError$(error, injector.get(TranslateService))
          .pipe(take(1))
          .subscribe((message) => injector.get(ToastService).show(message, 'error'));
      }
      return throwError(() => error);
    }),
  );
};
