import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceDue, PagedList, ReceiptDetail, ReceiptSearchParams, ReceiptSummary, RecordReceiptRequest, SchoolDues } from '@org/shared-models';
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

  /** R4-R9: records a payment; the same `clientRequestId` returns the receipt already recorded. */
  record(request: RecordReceiptRequest): Observable<ReceiptDetail> {
    return this.api.post<ReceiptDetail>('/receipts', request);
  }
}
