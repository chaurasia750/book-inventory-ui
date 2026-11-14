import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedList, VendorDetail, VendorFields, VendorSearchParams, VendorSummary } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The vendor endpoints of the API (`vendors/...`). Every route is for the Owner (vendor spec R8). */
@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly api = inject(ApiService);

  list(params: VendorSearchParams): Observable<PagedList<VendorSummary>> {
    return this.api.get<PagedList<VendorSummary>>('/vendors', { ...params } as QueryParams);
  }

  get(id: string): Observable<VendorDetail> {
    return this.api.get<VendorDetail>(`/vendors/${id}`);
  }

  create(request: VendorFields): Observable<VendorDetail> {
    return this.api.post<VendorDetail>('/vendors', request);
  }

  edit(id: string, request: VendorFields): Observable<void> {
    return this.api.put<void>(`/vendors/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/vendors/${id}/deactivate`, {});
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/vendors/${id}/activate`, {});
  }
}
