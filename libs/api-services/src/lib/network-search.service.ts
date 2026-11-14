import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkSearchService {
  readonly term = signal('');
  readonly refreshKey = signal(0);

  refresh(): void {
    this.refreshKey.update((k) => k + 1);
  }
}
