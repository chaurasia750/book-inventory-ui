import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@org/api-services';
import { City, CityFilterModel, CityListResponse, UpdateCityPayload } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/master/city';

  getList(params?: CityFilterModel): Observable<CityListResponse> {
    return this.api
      .get<Record<string, unknown>>(this.baseUrl, {
        PageIndex: params?.pageIndex,
        PageSize: params?.pageSize,
        Keyword: params?.keyword,
        SortingOrder: params?.sortingOrder,
        ColName: params?.colName,
        CID: params?.cid,
        SID: params?.sid,
        DistId: params?.distId,
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

          const items: City[] = rawItems.map((r) => ({
            id: (r['id'] as number) ?? (r['ctid'] as number) ?? (r['CTID'] as number) ?? 0,
            cityName: (r['cityName'] as string) ?? (r['CityName'] as string) ?? (r['name'] as string) ?? '',
            pincode: (r['pincode'] as string) ?? (r['Pincode'] as string) ?? '',
            cid: (r['cid'] as number) ?? (r['CID'] as number) ?? 0,
            countryName: (r['countryName'] as string) ?? (r['CountryName'] as string) ?? '',
            sid: (r['sid'] as number) ?? (r['SID'] as number) ?? 0,
            stateName: (r['stateName'] as string) ?? (r['StateName'] as string) ?? '',
            distId: (r['distId'] as number) ?? (r['DistId'] as number) ?? 0,
            districtName:
              (r['districtName'] as string) ?? (r['DistrictName'] as string) ?? (r['distName'] as string) ?? '',
            isActive:
              (r['active'] as boolean) ?? (r['Active'] as boolean) ?? (r['isActive'] as boolean) ?? true,
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

  getById(id: number): Observable<City> {
    return this.api.get<City>(`${this.baseUrl}/${id}`);
  }

  update(id: number, payload: UpdateCityPayload): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, payload);
  }
}
