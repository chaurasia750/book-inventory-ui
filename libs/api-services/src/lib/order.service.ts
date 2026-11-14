import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, QueryParams } from './api.service';
import {
  CreateOrderRequest,
  OrderDetail,
  OrderListItem,
  OrderListParams,
  PaginatedResponse,
} from '@org/shared-models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  createOrder(payload: CreateOrderRequest): Observable<number> {
    return this.api.post<number>('/orders', payload);
  }

  getMyOrders(params?: OrderListParams): Observable<PaginatedResponse<OrderListItem>> {
    return this.api.get<PaginatedResponse<OrderListItem>>('/orders/my', params as QueryParams);
  }

  getOrderDetail(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/orders/${id}`);
  }

  cancelOrder(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/orders/${id}/cancel`, {});
  }

  /** True when the member has never purchased an order (status Approved/Completed). */
  hasNoPurchasedOrder(memberId?: string): Observable<boolean> {
    const params: QueryParams = {};
    if (memberId) params['memberId'] = memberId;
    return this.api.get<unknown>('/orders/has-no-purchased-order', params).pipe(
      map((res) => {
        if (typeof res === 'boolean') return res;
        return (res as { data?: unknown } | null)?.data === true;
      }),
    );
  }
}
