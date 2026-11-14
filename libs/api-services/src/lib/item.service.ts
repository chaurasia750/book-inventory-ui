import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ItemDetail, ItemFields, ItemSearchParams, ItemSummary, PagedList } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The item endpoints of the API (`items/...`). Reads are open to Owner and Staff, writes to the Owner (item spec R9). */
@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly api = inject(ApiService);

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
