import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdjustStockRequest,
  EnterOpeningRequest,
  ItemStock,
  OpeningImportResult,
  PagedList,
  StockListParams,
  StockListRow,
  StockPosted,
} from '@org/shared-models';
import { API_BASE_URL } from './api-base-url.token';
import { ApiService, QueryParams } from './api.service';

/** The stock endpoints of the API (stock spec section 5). Reads are open to Owner and Staff, writes to the Owner (R10). */
@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: StockListParams): Observable<PagedList<StockListRow>> {
    return this.api.get<PagedList<StockListRow>>('/stock', { ...params } as QueryParams);
  }

  ofItem(itemId: string): Observable<ItemStock> {
    return this.api.get<ItemStock>(`/items/${itemId}/stock`);
  }

  enterOpening(itemId: string, request: EnterOpeningRequest): Observable<StockPosted> {
    return this.api.post<StockPosted>(`/items/${itemId}/stock/opening`, request);
  }

  adjust(itemId: string, request: AdjustStockRequest): Observable<StockPosted> {
    return this.api.post<StockPosted>(`/items/${itemId}/stock/adjustment`, request);
  }

  /** R17: the `.xlsx` template with the three columns. */
  template(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/stock/opening/template`, { responseType: 'blob' });
  }

  /** R17, R18: every row or none; a refusal is a 400 problem with `code` and the wrong `rows`. */
  importOpening(file: File, openingDate: string): Observable<OpeningImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('openingDate', openingDate);
    return this.http.post<OpeningImportResult>(`${this.baseUrl}/stock/opening/import`, form);
  }
}
