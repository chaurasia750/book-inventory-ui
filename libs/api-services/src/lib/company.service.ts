import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompanyDetail,
  CompanyFields,
  CompanySearchParams,
  CompanySummary,
  CreateCompanyRequest,
  CreatedCompany,
  CurrentCompany,
  PagedList,
  SessionCompanyResponse,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The company endpoints of the API (`companies/...`). Everything but `current` is for the Super Admin. */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  list(params: CompanySearchParams): Observable<PagedList<CompanySummary>> {
    return this.api.get<PagedList<CompanySummary>>('/companies', { ...params } as QueryParams);
  }

  get(id: string): Observable<CompanyDetail> {
    return this.api.get<CompanyDetail>(`/companies/${id}`);
  }

  create(request: CreateCompanyRequest): Observable<CreatedCompany> {
    return this.api.post<CreatedCompany>('/companies', request);
  }

  edit(id: string, request: CompanyFields): Observable<void> {
    return this.api.put<void>(`/companies/${id}`, request);
  }

  deactivate(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/companies/${id}/deactivate`, { reason });
  }

  activate(id: string, note?: string): Observable<void> {
    return this.api.post<void>(`/companies/${id}/activate`, { note });
  }

  /** The company of this session: a company account's own, or the one a Super Admin entered. */
  current(): Observable<CurrentCompany> {
    return this.api.get<CurrentCompany>('/companies/current');
  }

  enter(id: string): Observable<SessionCompanyResponse> {
    return this.api.post<SessionCompanyResponse>(`/companies/${id}/enter`, {});
  }

  leave(): Observable<SessionCompanyResponse> {
    return this.api.post<SessionCompanyResponse>('/companies/leave', {});
  }
}
