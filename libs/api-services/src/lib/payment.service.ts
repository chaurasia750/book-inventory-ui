 import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import {
  PaymentDetail,
  PaymentListParams,
  PaginatedResponse,
  AdminPaymentListItem,
  AdminPaymentDetail,
  AdminPaymentListParams,
} from '@org/shared-models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);

  getMyPayments(params?: PaymentListParams): Observable<PaginatedResponse<PaymentDetail>> {
    return this.api.get<PaginatedResponse<PaymentDetail>>('/payments/my', params as QueryParams);
  }

  getPaymentDetail(id: number): Observable<PaymentDetail> {
    return this.api.get<PaymentDetail>(`/payments/${id}`);
  }

  getPaymentByReference(referenceType: number, referenceId: number): Observable<PaymentDetail> {
    return this.api.get<PaymentDetail>('/payments/by-reference', {
      referenceType,
      referenceId,
    } as QueryParams);
  }

  getAdminPayments(params?: AdminPaymentListParams): Observable<PaginatedResponse<AdminPaymentListItem>> {
    return this.api.get<PaginatedResponse<AdminPaymentListItem>>('/admin/payments', params as QueryParams);
  }

  getAdminPaymentDetail(id: number): Observable<AdminPaymentDetail> {
    return this.api.get<AdminPaymentDetail>(`/admin/payments/${id}`);
  }

  verifyPayment(id: number, remarks: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/payments/${id}/verify`, { remarks });
  }

  rejectPayment(id: number, reason: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/payments/${id}/reject`, { reason });
  }
}
