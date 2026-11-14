import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddStaffRequest,
  CreatedCompanyStaff,
  PagedList,
  StatusChangeRequest,
  TemporaryPasswordResponse,
  UserDetail,
  UserSearchParams,
  UserSessionItem,
  UserSummary,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The Owner's endpoints for the Staff of their own company (`staff/...`). */
@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly api = inject(ApiService);

  list(params: UserSearchParams): Observable<PagedList<UserSummary>> {
    return this.api.get<PagedList<UserSummary>>('/staff', { ...params } as QueryParams);
  }

  get(id: string): Observable<UserDetail> {
    return this.api.get<UserDetail>(`/staff/${id}`);
  }

  sessions(id: string): Observable<UserSessionItem[]> {
    return this.api.get<UserSessionItem[]>(`/staff/${id}/sessions`);
  }

  add(request: AddStaffRequest): Observable<CreatedCompanyStaff> {
    return this.api.post<CreatedCompanyStaff>('/staff', request);
  }

  deactivate(id: string, request: StatusChangeRequest): Observable<void> {
    return this.api.post<void>(`/staff/${id}/deactivate`, request);
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/staff/${id}/activate`, {});
  }

  unlock(id: string): Observable<void> {
    return this.api.post<void>(`/staff/${id}/unlock`, {});
  }

  forceLogout(id: string): Observable<void> {
    return this.api.post<void>(`/staff/${id}/force-logout`, {});
  }

  resetPassword(id: string): Observable<TemporaryPasswordResponse> {
    return this.api.post<TemporaryPasswordResponse>(`/staff/${id}/temporary-password`, {});
  }
}
