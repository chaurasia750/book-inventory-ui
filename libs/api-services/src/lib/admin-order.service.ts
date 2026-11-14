import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import {
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderListResponse,
  AdminOrderSummary,
} from '@org/shared-models';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly api = inject(ApiService);

  getSummary(params?: AdminOrderListParams): Observable<AdminOrderSummary> {
    return this.api.get<AdminOrderSummary>('/admin/orders/summary', params as QueryParams);
  }

  getOrders(params?: AdminOrderListParams): Observable<AdminOrderListResponse> {
    return this.api.get<AdminOrderListResponse>('/admin/orders', params as QueryParams);
  }

  getOrderDetail(id: number, memberId?: string): Observable<AdminOrderDetail> {
    return this.api.get<AdminOrderDetail>(`/admin/orders/${id}`, memberId ? { memberId } as QueryParams : undefined);
  }

  verifyPayment(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/orders/${id}/verify-payment`, {});
  }

  approveOrder(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/orders/${id}/approve`, {});
  }

  rejectOrder(id: number, reason: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/orders/${id}/reject`, { reason });
  }
}
