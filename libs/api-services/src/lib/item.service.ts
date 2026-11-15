import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ItemDetail, ItemFields, ItemImportResult, ItemSearchParams, ItemSummary, PagedList } from '@org/shared-models';
import { API_BASE_URL } from './api-base-url.token';
import { ApiService, QueryParams } from './api.service';

/** The item endpoints of the API (`items/...`). Reads are open to Owner and Staff, writes to the Owner (item spec R9). */
@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: ItemSearchParams): Observable<PagedList<ItemSummary>> {
    return this.api.get<PagedList<ItemSummary>>('/items', { ...params } as QueryParams);
  }

  get(id: string): Observable<ItemDetail> {
    return this.api.get<ItemDetail>(`/items/${id}`);
  }

  create(request: ItemFields): Observable<ItemDetail> {
    return this.api.post<ItemDetail>('/items', request);
  }

  edit(id: string, request: ItemFields): Observable<void> {
    return this.api.put<void>(`/items/${id}`, request);
  }

  /** R18: the `.xlsx` template with the ten columns. */
  importTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/items/import/template`, { responseType: 'blob' });
  }

  /** R18-R22: every row or none; a refusal is a 400 problem with `code` and the wrong `rows`. */
  importItems(file: File): Observable<ItemImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ItemImportResult>(`${this.baseUrl}/items/import`, form);
  }

  replaceBarcodes(id: string, barcodes: string[]): Observable<void> {
    return this.api.put<void>(`/items/${id}/barcodes`, { barcodes });
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/items/${id}/deactivate`, {});
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/items/${id}/activate`, {});
  }
}
