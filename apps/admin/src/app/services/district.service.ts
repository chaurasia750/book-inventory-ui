import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@org/api-services';
import {
  District,
  DistrictFilterModel,
  DistrictListResponse,
  DistrictPayload,
  UpdateDistrictStatusPayload,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class DistrictService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/master/district';

  getList(params?: DistrictFilterModel): Observable<DistrictListResponse> {
    return this.api
      .get<Record<string, unknown>>(this.baseUrl, {
        PageIndex: params?.pageIndex,
        PageSize: params?.pageSize,
        Keyword: params?.keyword,
        SortingOrder: params?.sortingOrder,
        ColName: params?.colName,
        CID: params?.cid,
        SID: params?.sid,
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

          const items: District[] = rawItems.map((r) => ({
            id: (r['distId'] as number) ?? (r['DistId'] as number) ?? (r['id'] as number) ?? 0,
            name: (r['distName'] as string) ?? (r['DistName'] as string) ?? (r['name'] as string) ?? '',
            cid: (r['cid'] as number) ?? (r['CID'] as number) ?? 0,
            countryName: (r['countryName'] as string) ?? (r['CountryName'] as string) ?? '',
            sid: (r['sid'] as number) ?? (r['SID'] as number) ?? 0,
            stateName: (r['stateName'] as string) ?? (r['StateName'] as string) ?? '',
            isActive:
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

  getById(id: number): Observable<District> {
    return this.api.get<District>(`${this.baseUrl}/${id}`);
  }

  create(payload: DistrictPayload): Observable<District> {
    return this.api.post<District>(this.baseUrl, payload);
  }

  updateStatus(id: number, payload: UpdateDistrictStatusPayload): Observable<District> {
    return this.api.put<District>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
