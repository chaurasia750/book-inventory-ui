import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceDue, PagedList, ReceiptAllocationRequest, ReceiptProof, ReceiptDetail, ReceiptSearchParams, ReceiptSummary, RecordReceiptRequest, SchoolDues } from '@org/shared-models';
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

  /** R20: attaches a proof file (PNG, JPEG or PDF, at most 5 MB) to a recorded receipt. */
  uploadProof(receiptId: string, file: File): Observable<ReceiptProof> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ReceiptProof>(`${this.baseUrl}/receipts/${receiptId}/proofs`, form);
  }

  /** R20: the proof file's bytes (it needs the sign-in, so it is fetched here and not linked). */
  proofFile(receiptId: string, proofId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/receipts/${receiptId}/proofs/${proofId}`, { responseType: 'blob' });
  }

  removeProof(receiptId: string, proofId: string): Observable<void> {
    return this.api.delete<void>(`/receipts/${receiptId}/proofs/${proofId}`);
  }

  /** R17: the receipt as an A5 PDF. */
  receiptPdf(id: string): Observable<Blob> {
    return this.api.getBlob(`/receipts/${id}/pdf`);
  }

  /** R4-R9: records a payment; the same `clientRequestId` returns the receipt already recorded. */
  record(request: RecordReceiptRequest): Observable<ReceiptDetail> {
    return this.api.post<ReceiptDetail>('/receipts', request);
  }
}
