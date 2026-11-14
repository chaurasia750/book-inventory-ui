import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PendingRequestsService {
  readonly activeRequests = signal(0);

  private _count = 0;

  increment(): void {
    this._count++;
    this.activeRequests.set(this._count);
  }

  decrement(): void {
    this._count = Math.max(0, this._count - 1);
    this.activeRequests.set(this._count);
  }
}
