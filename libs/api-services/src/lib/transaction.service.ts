import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, QueryParams } from './api.service';

export interface TransactionItem {
  id: number;
  transType: string;
  remark: string;
  amount: number;
  transDate: string;
}

export interface TransactionListParams {
  transDate?: string;
  particular?: string;
  pageIndex?: number;
  pageSize?: number;
  sortingOrder?: number;
  colName?: string;
}

export interface TransactionListResponse {
  items: TransactionItem[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly api = inject(ApiService);

  getTransactionList(memberId: string, params?: TransactionListParams): Observable<TransactionListResponse> {
    return this.api
      .get<unknown>(`/incomes/transactions/${memberId}/list`, params as QueryParams)
      .pipe(map((res) => this.normalize(res)));
  }

  getAllTransactions(memberId: string): Observable<TransactionListResponse> {
    return this.api
      .get<unknown>(`/incomes/transactions/${memberId}/list`)
      .pipe(map((res) => this.normalize(res)));
  }

  private normalize(raw: unknown): TransactionListResponse {
    const root = this.asObject(raw);
    const data = this.asObject(root.data ?? root.result ?? root);

    const rawItems: unknown[] = data.items ?? data.items ?? [];
    const items: TransactionItem[] = rawItems.map((item) => {
      const obj = this.asObject(item);
      return {
        id: this.toNumber(obj.id) ?? 0,
        transType: String(obj.transType ?? obj.trans_type ?? ''),
        remark: String(obj.remark ?? ''),
        amount: this.toNumber(obj.amount) ?? 0,
        transDate: String(obj.transDate ?? obj.trans_date ?? ''),
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
