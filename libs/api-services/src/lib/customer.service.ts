import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerDetail, CustomerFields, CustomerSearchParams, CustomerSuggestion, CustomerSummary, PagedList } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The customer endpoints of the API (`customers/...`). Reads, the suggestion and create are for Owner and Staff, changes for the Owner (customer spec R9). */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);

  list(params: CustomerSearchParams): Observable<PagedList<CustomerSummary>> {
    return this.api.get<PagedList<CustomerSummary>>('/customers', { ...params } as QueryParams);
  }

  suggest(text: string): Observable<CustomerSuggestion[]> {
    return this.api.get<CustomerSuggestion[]>('/customers/suggest', { text });
  }

  get(id: string): Observable<CustomerDetail> {
    return this.api.get<CustomerDetail>(`/customers/${id}`);
  }

  create(request: CustomerFields): Observable<CustomerDetail> {
    return this.api.post<CustomerDetail>('/customers', request);
  }

  edit(id: string, request: CustomerFields): Observable<void> {
    return this.api.put<void>(`/customers/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/customers/${id}/deactivate`, {});
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/customers/${id}/activate`, {});
  }
}
