import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PendingRequestsService } from '@org/shared-utils';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const pending = inject(PendingRequestsService);
  pending.increment();
  return next(req).pipe(finalize(() => pending.decrement()));
};
