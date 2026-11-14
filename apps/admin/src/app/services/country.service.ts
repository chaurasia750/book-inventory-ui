import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@org/api-services';
import {
  Country,
  CountryFilterModel,
  CountryListResponse,
  CountryPayload,
  UpdateCountryStatusPayload,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/master/country';

  getList(params?: CountryFilterModel): Observable<CountryListResponse> {
    return this.api
      .get<Record<string, unknown>>(this.baseUrl, {
        PageIndex: params?.pageIndex,
        PageSize: params?.pageSize,
        Keyword: params?.keyword,
        SortingOrder: params?.sortingOrder,
        ColName: params?.colName,
        Active: params?.active,
      })
      .pipe(
        map((res: Record<string, unknown>) => {
          const pIdx = params?.pageIndex ?? 1;
          const pSize = params?.pageSize ?? 20;
          let rawItems: Record<string, unknown>[] = [];
          let pageIndex = pIdx;
          let pageSize = pSize;
          let totalCount = 0;

          if (res?.['items'] && Array.isArray(res['items'])) {
            rawItems = res['items'] as Record<string, unknown>[];
            pageIndex = (res['pageIndex'] as number) ?? pIdx;
            pageSize = (res['pageSize'] as number) ?? pSize;
            totalCount = (res['totalCount'] as number) ?? rawItems.length;
          } else if (res?.['data'] && Array.isArray(res['data'])) {
            rawItems = res['data'] as Record<string, unknown>[];
          } else if (Array.isArray(res)) {
            rawItems = res as unknown as Record<string, unknown>[];
          }

          const items: Country[] = rawItems.map((r) => ({
            id: (r['cid'] as number) ?? (r['CID'] as number) ?? (r['id'] as number) ?? 0,
            name: (r['countryName'] as string) ?? (r['CountryName'] as string) ?? (r['name'] as string) ?? '',
            isActive:
              (r['cActive'] as boolean) ??
              (r['active'] as boolean) ??
              (r['Active'] as boolean) ??
              (r['isActive'] as boolean) ??
              true,
          }));

          return {
            items,
            pageIndex,
            pageSize,
            totalCount: totalCount || items.length,
            totalPages: pageSize > 0 ? Math.ceil((totalCount || items.length) / pageSize) : 1,
          };
        }),
      );
  }

  getById(id: number): Observable<Country> {
    return this.api.get<Country>(`${this.baseUrl}/${id}`);
  }

  create(payload: CountryPayload): Observable<Country> {
    return this.api.post<Country>(this.baseUrl, payload);
  }

  updateStatus(id: number, payload: UpdateCountryStatusPayload): Observable<Country> {
    return this.api.put<Country>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
