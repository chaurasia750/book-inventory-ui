import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompanyDetail,
  CompanyImageKind,
  CompanyInvoiceIdentity,
  CompanyProfile,
  EditCompanyProfileRequest,
  SetCompanyInvoiceIdentityRequest,
  CompanyFields,
  CompanySearchParams,
  CompanySummary,
  CreateCompanyRequest,
  CreatedCompany,
  CurrentCompanyView,
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
  current(): Observable<CurrentCompanyView> {
    return this.api.get<CurrentCompanyView>('/companies/current');
  }

  /** Company R21: the session company's master data. */
  profile(): Observable<CompanyProfile> {
    return this.api.get<CompanyProfile>('/companies/current/profile');
  }

  /** Company R21: the Owner edits the address, contact, GSTIN, PAN and tagline of their own company. */
  editProfile(id: string, request: EditCompanyProfileRequest): Observable<void> {
    return this.api.put<void>(`/companies/${id}/profile`, request);
  }

  /** Company R17-R20: the logo and signature links, the bank account and the invoice settings. */
  invoiceIdentity(): Observable<CompanyInvoiceIdentity> {
    return this.api.get<CompanyInvoiceIdentity>('/companies/current/invoice-identity');
  }

  setInvoiceIdentity(id: string, request: SetCompanyInvoiceIdentityRequest): Observable<void> {
    return this.api.put<void>(`/companies/${id}/invoice-identity`, request);
  }

  uploadImage(id: string, kind: CompanyImageKind, file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file);
    return this.api.post<void>(`/companies/${id}/${kind}`, form);
  }

  removeImage(id: string, kind: CompanyImageKind): Observable<void> {
    return this.api.delete<void>(`/companies/${id}/${kind}`);
  }

  /** The image behind a `logoUrl` / `signatureUrl` (it needs the sign-in, so it is fetched, not linked). */
  image(url: string): Observable<Blob> {
    return this.api.getBlob(url.replace(/^\/api\/v\d+/, ''));
  }

  enter(id: string): Observable<SessionCompanyResponse> {
    return this.api.post<SessionCompanyResponse>(`/companies/${id}/enter`, {});
  }

  leave(): Observable<SessionCompanyResponse> {
    return this.api.post<SessionCompanyResponse>('/companies/leave', {});
  }
}
