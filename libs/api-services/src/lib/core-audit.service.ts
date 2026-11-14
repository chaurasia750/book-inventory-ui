import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditEntry, AuditSearchParams, PagedList } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The Super Admin's audit log (core A7, A8). Read only: the API has no way to change a row. */
@Injectable({ providedIn: 'root' })
export class CoreAuditService {
  private readonly api = inject(ApiService);

  search(params: AuditSearchParams): Observable<PagedList<AuditEntry>> {
    return this.api.get<PagedList<AuditEntry>>('/audit', { ...params } as QueryParams);
  }

  /** The entity types that exist in the log, for the filter (core A8). */
  entityTypes(): Observable<string[]> {
    return this.api.get<string[]>('/audit/entity-types');
  }
}
