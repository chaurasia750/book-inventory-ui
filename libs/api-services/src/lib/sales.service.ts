import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  InvoiceDetail,
  InvoiceMade,
  InvoiceParams,
  InvoiceSummary,
  MakeInvoiceRequest,
  PagedList,
  SaveSchoolOrderRequest,
  SchoolOrderDetail,
  SchoolOrderParams,
  SchoolOrderSummary,
  SessionChoice,
  SessionCutOffs,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The school order and invoice endpoints (sales spec section 5) and the school session cut-offs (school R19). */
@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly api = inject(ApiService);

  orders(params: SchoolOrderParams): Observable<PagedList<SchoolOrderSummary>> {
    return this.api.get<PagedList<SchoolOrderSummary>>('/school-orders', { ...params } as QueryParams);
  }

  order(id: string): Observable<SchoolOrderDetail> {
    return this.api.get<SchoolOrderDetail>(`/school-orders/${id}`);
  }

  createOrder(request: SaveSchoolOrderRequest): Observable<SchoolOrderDetail> {
    return this.api.post<SchoolOrderDetail>('/school-orders', request);
  }

  replaceOrder(id: string, request: SaveSchoolOrderRequest): Observable<void> {
    return this.api.put<void>(`/school-orders/${id}`, request);
  }

  deleteOrder(id: string): Observable<void> {
    return this.api.delete<void>(`/school-orders/${id}`);
  }

  confirmOrder(id: string): Observable<void> {
    return this.api.post<void>(`/school-orders/${id}/confirm`, {});
  }

  closeOrder(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/school-orders/${id}/close`, { reason });
  }

  sessionChoice(schoolId: string, date: string): Observable<SessionChoice> {
    return this.api.get<SessionChoice>('/school-orders/session-choice', { schoolId, date });
  }

  makeInvoice(orderId: string, request: MakeInvoiceRequest): Observable<InvoiceMade> {
    return this.api.post<InvoiceMade>(`/school-orders/${orderId}/invoices`, request);
  }

  invoices(params: InvoiceParams): Observable<PagedList<InvoiceSummary>> {
    return this.api.get<PagedList<InvoiceSummary>>('/invoices', { ...params } as QueryParams);
  }

  invoice(id: string): Observable<InvoiceDetail> {
    return this.api.get<InvoiceDetail>(`/invoices/${id}`);
  }

  cancelInvoice(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/invoices/${id}/cancel`, { reason });
  }

  cutOffs(): Observable<SessionCutOffs> {
    return this.api.get<SessionCutOffs>('/school-settings/session-cut-offs');
  }

  changeCutOffs(value: SessionCutOffs): Observable<SessionCutOffs> {
    return this.api.put<SessionCutOffs>('/school-settings/session-cut-offs', value);
  }
}
