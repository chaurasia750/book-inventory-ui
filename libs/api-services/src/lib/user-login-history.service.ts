import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, QueryParams } from './api.service';

export interface UserLoginHistoryItem {
  loginDateTime: string;
  browser: string;
  clientIp: string;
}

export interface UserLoginHistoryParams {
  memberId?: string;
  UserName?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface UserLoginHistoryListResponse {
  items: UserLoginHistoryItem[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class UserLoginHistoryService {
  private readonly api = inject(ApiService);

  getLoginHistory(params?: UserLoginHistoryParams): Observable<UserLoginHistoryListResponse> {
    return this.api
      .get<unknown>('/user-login-history/list', params as QueryParams)
      .pipe(map((res) => this.normalize(res)));
  }

  private normalize(raw: unknown): UserLoginHistoryListResponse {
    const root = this.asObject(raw);
    const data = this.asObject(root.data ?? root.result ?? root);

    const rawItems: unknown[] = data.items ?? [];
    const items: UserLoginHistoryItem[] = rawItems.map((item) => {
      const obj = this.asObject(item);
      return {
        loginDateTime: String(obj.loginDateTime ?? obj.login_date_time ?? ''),
        browser: String(obj.browser ?? ''),
        clientIp: String(obj.clientIp ?? obj.client_ip ?? ''),
      };
    });

    return {
      items,
      totalCount: this.toNumber(data.totalCount ?? data.total_count) ?? 0,
      pageIndex: this.toNumber(data.pageIndex ?? data.page_index) ?? 0,
      pageSize: this.toNumber(data.pageSize ?? data.page_size) ?? 20,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private asObject(value: unknown): any {
    return value && typeof value === 'object' ? value : {};
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
