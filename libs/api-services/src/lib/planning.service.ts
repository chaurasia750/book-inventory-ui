import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CopyBookListsRequest, CopyBookListsResponse, SaveBookListRequest, SchoolBookLists } from '@org/shared-models';
import { ApiService } from './api.service';

/** The class-wise book list endpoints (planning spec section 5). */
@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly api = inject(ApiService);

  bookLists(schoolId: string, session?: string): Observable<SchoolBookLists> {
    return this.api.get<SchoolBookLists>(`/schools/${schoolId}/book-lists`, session ? { session } : undefined);
  }

  saveBookList(schoolId: string, session: string, className: string, request: SaveBookListRequest): Observable<void> {
    return this.api.put<void>(`/schools/${schoolId}/book-lists/${encodeURIComponent(session)}/${encodeURIComponent(className)}`, request);
  }

  deleteBookList(schoolId: string, session: string, className: string): Observable<void> {
    return this.api.delete<void>(`/schools/${schoolId}/book-lists/${encodeURIComponent(session)}/${encodeURIComponent(className)}`);
  }

  copyBookLists(schoolId: string, session: string, request: CopyBookListsRequest): Observable<CopyBookListsResponse> {
    return this.api.post<CopyBookListsResponse>(`/schools/${schoolId}/book-lists/${encodeURIComponent(session)}/copy`, request);
  }
}
