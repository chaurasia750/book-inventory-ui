import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedList, SchoolDetail, SchoolFields, SchoolSearchParams, SchoolSummary } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The school endpoints of the API (`schools/...`). Reads are open to Owner and Staff, writes to the Owner. */
@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly api = inject(ApiService);

  list(params: SchoolSearchParams): Observable<PagedList<SchoolSummary>> {
    return this.api.get<PagedList<SchoolSummary>>('/schools', { ...params } as QueryParams);
  }

  get(id: string): Observable<SchoolDetail> {
    return this.api.get<SchoolDetail>(`/schools/${id}`);
  }

  create(request: SchoolFields): Observable<SchoolDetail> {
    return this.api.post<SchoolDetail>('/schools', request);
  }

  edit(id: string, request: SchoolFields): Observable<void> {
    return this.api.put<void>(`/schools/${id}`, request);
  }

  replaceClasses(id: string, classes: string[]): Observable<void> {
    return this.api.put<void>(`/schools/${id}/classes`, { classes });
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/schools/${id}/deactivate`, {});
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/schools/${id}/activate`, {});
  }
}
