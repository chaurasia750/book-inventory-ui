import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChangeRoleRequest,
  CreatedStaff,
  CreateStaffRequest,
  PagedList,
  StatusChangeRequest,
  UpdateUserRequest,
  UserDetail,
  UserSearchParams,
  UserSessionItem,
  UserStatusHistoryItem,
  UserSummary,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The Super Admin account-management endpoints of the iam API (`users/...`). */
@Injectable({ providedIn: 'root' })
export class IamUsersService {
  private readonly api = inject(ApiService);

  list(params: UserSearchParams): Observable<PagedList<UserSummary>> {
    return this.api.get<PagedList<UserSummary>>('/users', { ...params } as QueryParams);
  }

  get(id: string): Observable<UserDetail> {
    return this.api.get<UserDetail>(`/users/${id}`);
  }

  statusHistory(id: string): Observable<UserStatusHistoryItem[]> {
    return this.api.get<UserStatusHistoryItem[]>(`/users/${id}/status-history`);
  }

  sessions(id: string): Observable<UserSessionItem[]> {
    return this.api.get<UserSessionItem[]>(`/users/${id}/sessions`);
  }

  create(request: CreateStaffRequest): Observable<CreatedStaff> {
    return this.api.post<CreatedStaff>('/users', request);
  }

  update(id: string, request: UpdateUserRequest): Observable<void> {
    return this.api.put<void>(`/users/${id}`, request);
  }

  /** `approve`, `activate`, `deactivate`, `suspend` or `reject`. */
  changeStatus(id: string, action: 'approve' | 'activate' | 'deactivate' | 'suspend' | 'reject', request: StatusChangeRequest): Observable<void> {
    return this.api.post<void>(`/users/${id}/${action}`, request);
  }

  changeRole(id: string, request: ChangeRoleRequest): Observable<void> {
    return this.api.post<void>(`/users/${id}/change-role`, request);
  }

  /** `unlock`, `force-logout`, `force-password-change`, `reset-password` or `release-identity`. */
  perform(id: string, action: 'unlock' | 'force-logout' | 'force-password-change' | 'reset-password' | 'release-identity'): Observable<void> {
    return this.api.post<void>(`/users/${id}/${action}`, {});
  }

  revokeSession(id: string, sessionId: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}/sessions/${sessionId}`);
  }
}
