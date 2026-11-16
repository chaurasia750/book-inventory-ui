import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The dashboard endpoint of the API (`dashboard`; report spec section 5, R1-R13). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  /** The dashboard of a session (`2026-27`); without a session the current one. */
  get(session?: string): Observable<Dashboard> {
    return this.api.get<Dashboard>('/dashboard', { session } as QueryParams);
  }
}
