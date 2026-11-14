import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@org/api-services';
import { PropertyField, PropertyTypeItem } from '../models/property-field.model';
import { PropertyDetail, PropertyListItem, PaginatedData, InventoryListRequest } from '../models/property-detail.model';

export const INVENTORY_SERVICE = new InjectionToken<IInventoryService>('INVENTORY_SERVICE', {
  factory: () => inject(InventoryService),
});

export const enum PropertyStatus {
  Active = 1,
  Draft = 2,
  Closed = 3,
}

export interface CreateInventoryField {
  propertyFieldId: number;
  value: string;
}

export interface CreateInventoryPayload {
  propertyTypeId: number;
  title: string;
  description: string;
  fields: CreateInventoryField[];
  documentIds: number[];
  profileId: number;
  status?: string;
}

export interface IInventoryService {
  getPropertyTypes(): Observable<PropertyTypeItem[]>;
  getPropertiesByTypeId(typeId: number): Observable<PropertyTypeItem[]>;
  getPropertyFields(propertyTypeId: string | number): Observable<PropertyField[]>;
  getPropertyList(request: InventoryListRequest): Observable<PaginatedData<PropertyListItem>>;
  createInventory(payload: CreateInventoryPayload): Observable<PropertyDetail>;
  updateProperty(id: number, payload: CreateInventoryPayload): Observable<PropertyDetail>;
  getPropertyById(id: number): Observable<PropertyDetail>;
  activateProperty(id: number): Observable<unknown>;
  deactivateProperty(id: number): Observable<unknown>;
  closeProperty(id: number): Observable<unknown>;
}

@Injectable({ providedIn: 'root' })
export class InventoryService implements IInventoryService {
  private readonly api = inject(ApiService);

  getPropertyTypes(): Observable<PropertyTypeItem[]> {
    return this.api.get<PropertyTypeItem[]>('/inventory/property-types');
  }

  getPropertiesByTypeId(typeId: number): Observable<PropertyTypeItem[]> {
    return this.api.get<PropertyTypeItem[]>(`/inventory/property-types/${typeId}/property`);
  }

  getPropertyFields(propertyTypeId: string | number): Observable<PropertyField[]> {
    return this.api.get<PropertyField[]>(`/inventory/property-fields/property-type/${propertyTypeId}`);
  }

  getPropertyList(request: InventoryListRequest): Observable<PaginatedData<PropertyListItem>> {
    const params: Record<string, string | number> = {
      PageIndex: request.pageIndex,
      PageSize: request.pageSize,
    };
    if (request.propertyTypeId != null) params['PropertyTypeId'] = request.propertyTypeId;
    if (request.title) params['Title'] = request.title;
    if (request.sortingOrder) params['SortingOrder'] = request.sortingOrder;
    if (request.colName) params['ColName'] = request.colName;

    return this.api.get<PaginatedData<PropertyListItem>>('/inventory/property/list', params).pipe(
      map(paginatedData => ({
        ...paginatedData,
        items: (paginatedData.items ?? []).map(item => ({
          id: item.id ?? (item as any).Id,
          title: item.title ?? (item as any).Title ?? '',
          propertyType: item.propertyType ?? (item as any).PropertyType ?? '',
          status: item.status ?? (item as any).Status ?? null,
          createdAt: item.createdAt ?? (item as any).CreatedAt ?? '',
          description: item.description ?? (item as any).Description ?? undefined,
          profileImageId: item.profileImageId ?? (item as any).ProfileImageId ?? null,
        })),
      })),
    );
  }

  createInventory(payload: CreateInventoryPayload): Observable<PropertyDetail> {
    return this.api.post<PropertyDetail>('/inventory/property/create', payload);
  }

  updateProperty(id: number, payload: CreateInventoryPayload): Observable<PropertyDetail> {
    return this.api.put<PropertyDetail>(`/inventory/property/${id}`, payload);
  }

  getPropertyById(id: number): Observable<PropertyDetail> {
    return this.api.get<PropertyDetail>(`/inventory/property/${id}`);
  }

  activateProperty(id: number): Observable<unknown> {
    return this.api.put(`/inventory/property/${id}/activate`, {});
  }

  deactivateProperty(id: number): Observable<unknown> {
    return this.api.put(`/inventory/property/${id}/deactivate`, {});
  }

  closeProperty(id: number): Observable<unknown> {
    return this.api.put(`/inventory/property/${id}/close`, {});
  }
}
