import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Counter,
  CounterBill,
  CounterBillMade,
  CounterBillSearchParams,
  CounterBillSummary,
  CounterDaySummary,
  CounterFields,
  CounterSearchParams,
  MakeCounterBillRequest,
  PagedList,
  StudentSuggestion,
} from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The school counter sale endpoints of the API (`counters`, `students/suggest`, `counter-bills`; sales spec section 5). */
@Injectable({ providedIn: 'root' })
export class CounterService {
  private readonly api = inject(ApiService);

  list(params: CounterSearchParams): Observable<PagedList<Counter>> {
    return this.api.get<PagedList<Counter>>('/counters', { ...params } as QueryParams);
  }

  get(id: string): Observable<Counter> {
    return this.api.get<Counter>(`/counters/${id}`);
  }

  open(request: CounterFields): Observable<Counter> {
    return this.api.post<Counter>('/counters', request);
  }

  edit(id: string, request: CounterFields): Observable<void> {
    return this.api.put<void>(`/counters/${id}`, request);
  }

  close(id: string): Observable<void> {
    return this.api.post<void>(`/counters/${id}/close`, {});
  }

  reopen(id: string): Observable<void> {
    return this.api.post<void>(`/counters/${id}/open`, {});
  }

  /** R41: at most 20 students of the school whose name contains the text, optionally of one class. */
  suggestStudents(schoolId: string, text: string, className?: string): Observable<StudentSuggestion[]> {
    return this.api.get<StudentSuggestion[]>('/students/suggest', { schoolId, text, className } as QueryParams);
  }

  makeBill(request: MakeCounterBillRequest): Observable<CounterBillMade> {
    return this.api.post<CounterBillMade>('/counter-bills', request);
  }

  bills(params: CounterBillSearchParams): Observable<PagedList<CounterBillSummary>> {
    return this.api.get<PagedList<CounterBillSummary>>('/counter-bills', { ...params } as QueryParams);
  }

  bill(id: string): Observable<CounterBill> {
    return this.api.get<CounterBill>(`/counter-bills/${id}`);
  }

  cancelBill(id: string, reason: string): Observable<void> {
    return this.api.post<void>(`/counter-bills/${id}/cancel`, { reason });
  }

  /** R50: the day summary of one counter or, without a counter, the whole company. */
  daySummary(date: string, counterId?: string): Observable<CounterDaySummary> {
    return this.api.get<CounterDaySummary>('/counter-bills/day-summary', { date, counterId } as QueryParams);
  }

  /** R51: the bill as an A5 PDF. */
  billPdf(id: string): Observable<Blob> {
    return this.api.getBlob(`/counter-bills/${id}/pdf`);
  }
}
