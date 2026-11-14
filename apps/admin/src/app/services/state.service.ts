import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@org/api-services';
import {
  State,
  StateFilterModel,
  StateListResponse,
  StatePayload,
  UpdateStateStatusPayload,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/master/state';

  getList(params?: StateFilterModel): Observable<StateListResponse> {
    return this.api
      .get<Record<string, unknown>>(this.baseUrl, {
        PageIndex: params?.pageIndex,
        PageSize: params?.pageSize,
        Keyword: params?.keyword,
        SortingOrder: params?.sortingOrder,
        ColName: params?.colName,
        CID: params?.cid,
        sActive: params?.sActive,
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

          const items: State[] = rawItems.map((r) => ({
            id: (r['sid'] as number) ?? (r['SID'] as number) ?? (r['id'] as number) ?? 0,
            name: (r['stateName'] as string) ?? (r['StateName'] as string) ?? (r['name'] as string) ?? '',
            cid: (r['cid'] as number) ?? (r['CID'] as number) ?? 0,
            countryName: (r['countryName'] as string) ?? (r['CountryName'] as string) ?? '',
            isActive:
              (r['sActive'] as boolean) ??
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

  getListByCountry(cid: number): Observable<StateListResponse> {
    return this.getList({ cid, pageSize: 200 });
  }

  getById(id: number): Observable<State> {
    return this.api.get<State>(`${this.baseUrl}/${id}`);
  }

  create(payload: StatePayload): Observable<State> {
    return this.api.post<State>(this.baseUrl, payload);
  }

  updateStatus(id: number, payload: UpdateStateStatusPayload): Observable<State> {
    return this.api.put<State>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
