import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceDue, PagedList, ReceiptAllocationRequest, ReceiptDetail, ReceiptSearchParams, ReceiptSummary, RecordReceiptRequest, SchoolDues } from '@org/shared-models';
import { API_BASE_URL } from './api-base-url.token';
import { ApiService, QueryParams } from './api.service';

/** The payment endpoints of the API (payment spec section 5): for the Owner (and a Super Admin inside the company). */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** R3: a school's balance and open invoices, oldest first. */
  dues(schoolId: string): Observable<SchoolDues> {
    return this.api.get<SchoolDues>('/payment/dues', { schoolId });
  }

  /** R16: allocated and due amounts of up to 100 invoices (the id list repeats the query key). */
  invoiceDues(invoiceIds: string[]): Observable<InvoiceDue[]> {
    let params = new HttpParams();
    for (const id of invoiceIds) {
      params = params.append('invoiceIds', id);
    }
    return this.http.get<InvoiceDue[]>(`${this.baseUrl}/payment/invoice-dues`, { params });
  }

  list(params: ReceiptSearchParams): Observable<PagedList<ReceiptSummary>> {
    return this.api.get<PagedList<ReceiptSummary>>('/receipts', { ...params } as QueryParams);
  }

  get(id: string): Observable<ReceiptDetail> {
    return this.api.get<ReceiptDetail>(`/receipts/${id}`);
  }

  /** R10: the cheque cleared on this date (`yyyy-MM-dd`, not before the cheque date). */
  clearCheque(receiptId: string, modeId: string, date: string): Observable<void> {
    return this.api.post<void>(`/receipts/${receiptId}/cheques/${modeId}/clear`, { date });
  }

  /** R10, R11: the cheque bounced on this date, with a reason (5-500 characters). */
  bounceCheque(receiptId: string, modeId: string, date: string, reason: string): Observable<void> {
    return this.api.post<void>(`/receipts/${receiptId}/cheques/${modeId}/bounce`, { date, reason });
  }

  /** R13: applies the receipt's advance to open invoices (oldest first when no allocations are given). */
  adjustAdvance(receiptId: string, allocations?: ReceiptAllocationRequest[]): Observable<void> {
    return this.api.post<void>(`/receipts/${receiptId}/adjust-advance`, { allocations });
  }

  /** R14: cancels a recorded receipt with a reason (5-500 characters). */
  cancelReceipt(receiptId: string, reason: string): Observable<void> {
    return this.api.post<void>(`/receipts/${receiptId}/cancel`, { reason });
  }

  /** R4-R9: records a payment; the same `clientRequestId` returns the receipt already recorded. */
  record(request: RecordReceiptRequest): Observable<ReceiptDetail> {
    return this.api.post<ReceiptDetail>('/receipts', request);
  }
}
