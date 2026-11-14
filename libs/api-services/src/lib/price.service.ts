import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditEntry,
  BulkPreviewResult,
  BulkPriceRequest,
  BulkTotals,
  CopyPriceRequest,
  CopyPriceResult,
  PagedList,
  PriceListParams,
  PriceListRow,
  PriceVersion,
  PriceVersionFields,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';
import { CoreAuditService } from './core-audit.service';

/** The price endpoints of the API (`items/{id}/prices`, `prices/...`). Reads are open to Owner and Staff, writes to the Owner (price spec R5, R6). */
@Injectable({ providedIn: 'root' })
export class PriceService {
  private readonly api = inject(ApiService);
  private readonly audit = inject(CoreAuditService);

  list(params: PriceListParams): Observable<PagedList<PriceListRow>> {
    return this.api.get<PagedList<PriceListRow>>('/prices', { ...params } as QueryParams);
  }

  versions(itemId: string): Observable<PriceVersion[]> {
    return this.api.get<PriceVersion[]>(`/items/${itemId}/prices`);
  }

  add(itemId: string, request: PriceVersionFields): Observable<PriceVersion> {
    return this.api.post<PriceVersion>(`/items/${itemId}/prices`, request);
  }

  edit(itemId: string, versionId: string, request: PriceVersionFields): Observable<void> {
    return this.api.put<void>(`/items/${itemId}/prices/${versionId}`, request);
  }

  copy(request: CopyPriceRequest): Observable<CopyPriceResult> {
    return this.api.post<CopyPriceResult>('/prices/copy', request);
  }

  bulkPreview(request: BulkPriceRequest): Observable<BulkPreviewResult> {
    return this.api.post<BulkPreviewResult>('/prices/bulk/preview', request);
  }

  bulkApply(request: BulkPriceRequest): Observable<BulkTotals> {
    return this.api.post<BulkTotals>('/prices/bulk/apply', request);
  }

  /** R15: the history of a version is the audit trail of that version (the Owner reads it). */
  history(versionId: string): Observable<PagedList<AuditEntry>> {
    return this.audit.search({ entityType: 'PriceVersion', entityId: versionId, pageIndex: 1, pageSize: 50 });
  }
}
