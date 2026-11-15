import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LedgerStatement, LedgerStatementParams, OutstandingPage, OutstandingParams } from '@org/shared-models';
import { ApiService, QueryParams } from './api.service';

/** The ledger read endpoints of the API (finance spec section 5): the Owner's only (R13). Nothing posts from the screens. */
@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly api = inject(ApiService);

  /** R9: `party` is `schools` or `vendors`, the same word as the API route. */
  statement(party: 'schools' | 'vendors', partyId: string, params: LedgerStatementParams): Observable<LedgerStatement> {
    return this.api.get<LedgerStatement>(`/${party}/${partyId}/ledger`, { ...params } as QueryParams);
  }

  /** R17: the balances of the listed schools or vendors (at most 100 ids), by id. */
  balances(party: 'schools' | 'vendors', ids: readonly string[]): Observable<Record<string, number>> {
    const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
    return this.api.get<Record<string, number>>(`/ledger/balances/${party}?${query}`);
  }

  /** R11: the outstanding list of all schools or all vendors. */
  outstanding(party: 'schools' | 'vendors', params: OutstandingParams): Observable<OutstandingPage> {
    return this.api.get<OutstandingPage>(`/ledger/outstanding/${party}`, { ...params } as QueryParams);
  }
}
