import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoginHistoryItem,
  LoginLogItem,
  LoginLogSearchParams,
  OwnSession,
  PagedList,
  UpdateOwnProfileRequest,
} from '@org/shared-models';
import { API_BASE_URL } from './api-base-url.token';
import { ApiService, QueryParams } from './api.service';

/** What any signed-in user does with their own account (`auth/sessions`, `auth/login-history`, `auth/profile`). */
@Injectable({ providedIn: 'root' })
export class IamSelfService {
  private readonly api = inject(ApiService);

  sessions(): Observable<OwnSession[]> {
    return this.api.get<OwnSession[]>('/auth/sessions');
  }

  revokeSession(id: string): Observable<void> {
    return this.api.delete<void>(`/auth/sessions/${id}`);
  }

  loginHistory(pageIndex: number, pageSize: number): Observable<PagedList<LoginHistoryItem>> {
    return this.api.get<PagedList<LoginHistoryItem>>('/auth/login-history', { pageIndex, pageSize });
  }

  updateProfile(request: UpdateOwnProfileRequest): Observable<void> {
    return this.api.put<void>('/auth/profile', request);
  }

  /** Ends every session of the caller, this one included (the caller then signs out locally). */
  logoutAll(): Observable<void> {
    return this.api.post<void>('/auth/logout-all', {});
  }
}

/** The Super Admin's whole-log search and CSV export (`login-logs`). */
@Injectable({ providedIn: 'root' })
export class IamLoginLogService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  search(params: LoginLogSearchParams): Observable<PagedList<LoginLogItem>> {
    return this.api.get<PagedList<LoginLogItem>>('/login-logs', { ...params } as QueryParams);
  }

  /** The CSV of the same filters as a file; the server refuses an export that would be too large. */
  export(params: Omit<LoginLogSearchParams, 'pageIndex' | 'pageSize'>): Observable<Blob> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value));
    }
    return this.http.get(`${this.baseUrl}/login-logs/export`, { params: httpParams, responseType: 'blob' });
  }
}
