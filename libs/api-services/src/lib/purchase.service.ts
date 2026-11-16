import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MakeVendorReturnRequest, PagedList, VendorReturn, VendorReturnMade, VendorReturnSearchParams, VendorReturnSummary } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The purchase endpoints of the API (`vendor-returns`; purchase spec section 5, R2-R12). */
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly api = inject(ApiService);

  makeVendorReturn(request: MakeVendorReturnRequest): Observable<VendorReturnMade> {
    return this.api.post<VendorReturnMade>('/vendor-returns', request);
  }

  vendorReturns(params: VendorReturnSearchParams): Observable<PagedList<VendorReturnSummary>> {
    return this.api.get<PagedList<VendorReturnSummary>>('/vendor-returns', { ...params } as QueryParams);
  }

  vendorReturn(id: string): Observable<VendorReturn> {
    return this.api.get<VendorReturn>(`/vendor-returns/${id}`);
  }

  cancelVendorReturn(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/vendor-returns/${id}/cancel`, { reason });
  }

  /** R11: the vendor return as an A4 Debit Note PDF. */
  debitNotePdf(id: string): Observable<Blob> {
    return this.api.getBlob(`/vendor-returns/${id}/pdf`);
  }
}
