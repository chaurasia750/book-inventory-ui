import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddBulkLinesRequest,
  AddClassSetsRequest,
  AddLinesResponse,
  InvoiceDetail,
  InvoiceLayout,
  InvoiceLayoutResponse,
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

  /** R26: the invoice in the given layout, or in the school's default when none is given. */
  invoice(id: string, layout?: InvoiceLayout): Observable<InvoiceDetail> {
    return this.api.get<InvoiceDetail>(`/invoices/${id}`, layout ? { layout } : undefined);
  }

  /** Sales R28: the invoice as a PDF in the given layout (the school's default when none is given). */
  invoicePdf(id: string, layout?: InvoiceLayout): Observable<Blob> {
    return this.api.getBlob(`/invoices/${id}/pdf`, layout ? { layout } : undefined);
  }

  invoiceLayout(schoolId: string): Observable<InvoiceLayoutResponse> {
    return this.api.get<InvoiceLayoutResponse>(`/schools/${schoolId}/invoice-layout`);
  }

  changeInvoiceLayout(schoolId: string, layout: InvoiceLayout): Observable<InvoiceLayoutResponse> {
    return this.api.put<InvoiceLayoutResponse>(`/schools/${schoolId}/invoice-layout`, { layout });
  }

  /** R22: the books of whole classes, students x quantity per student. */
  addClassSets(orderId: string, request: AddClassSetsRequest): Observable<AddLinesResponse> {
    return this.api.post<AddLinesResponse>(`/school-orders/${orderId}/class-sets`, request);
  }

  /** R23: many items with one quantity and class. */
  addBulkLines(orderId: string, request: AddBulkLinesRequest): Observable<AddLinesResponse> {
    return this.api.post<AddLinesResponse>(`/school-orders/${orderId}/bulk-lines`, request);
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
