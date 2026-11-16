import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreditNote,
  CreditNoteMade,
  CreditNoteSearchParams,
  CreditNoteSummary,
  InvoiceReturns,
  MakeCreditNoteRequest,
  PagedList,
  RecordRefundRequest,
  Refund,
  RefundMade,
  RefundSearchParams,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The school return endpoints of the API (`credit-notes`, `refunds`, `invoices/{id}/returnable`; sales spec section 5, R53-R69). */
@Injectable({ providedIn: 'root' })
export class ReturnService {
  private readonly api = inject(ApiService);

  makeCreditNote(request: MakeCreditNoteRequest): Observable<CreditNoteMade> {
    return this.api.post<CreditNoteMade>('/credit-notes', request);
  }

  creditNotes(params: CreditNoteSearchParams): Observable<PagedList<CreditNoteSummary>> {
    return this.api.get<PagedList<CreditNoteSummary>>('/credit-notes', { ...params } as QueryParams);
  }

  creditNote(id: string): Observable<CreditNote> {
    return this.api.get<CreditNote>(`/credit-notes/${id}`);
  }

  cancelCreditNote(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/credit-notes/${id}/cancel`, { reason });
  }

  /** R54, R61: the invoice's returnable lines and its credit notes. */
  invoiceReturns(invoiceId: string): Observable<InvoiceReturns> {
    return this.api.get<InvoiceReturns>(`/invoices/${invoiceId}/returnable`);
  }

  recordRefund(request: RecordRefundRequest): Observable<RefundMade> {
    return this.api.post<RefundMade>('/refunds', request);
  }

  refunds(params: RefundSearchParams): Observable<PagedList<Refund>> {
    return this.api.get<PagedList<Refund>>('/refunds', { ...params } as QueryParams);
  }

  refund(id: string): Observable<Refund> {
    return this.api.get<Refund>(`/refunds/${id}`);
  }

  cancelRefund(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/refunds/${id}/cancel`, { reason });
  }

  /** R68: the refund slip as an A5 PDF. */
  refundSlip(id: string): Observable<Blob> {
    return this.api.getBlob(`/refunds/${id}/pdf`);
  }
}
