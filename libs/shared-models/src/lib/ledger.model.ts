/** Finance spec R3: the kind of party a ledger belongs to (the API routes use `schools` and `vendors`). */
export type LedgerPartyType = 'SCHOOL' | 'VENDOR' | 'CUSTOMER';

/** R9: the statement filter: a financial year (`2026-27`), a session (schools only), or a date range; empty means all. */
export interface LedgerStatementParams {
  financialYear?: string;
  session?: string;
  from?: string;
  to?: string;
}

/** R9: one line of a statement with the party's balance after it. */
export interface LedgerStatementRow {
  /** `yyyy-MM-dd`. */
  date: string;
  documentType: string;
  documentId: string;
  documentNumber: string;
  postingKind: 'POST' | 'REVERSAL';
  narration: string | null;
  session: string | null;
  financialYear: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
}

/** R9, R16: `GET schools/{id}/ledger` or `GET vendors/{id}/ledger`. */
export interface LedgerStatement {
  partyType: LedgerPartyType;
  partyId: string;
  partyCode: string;
  partyName: string;
  isActive: boolean;
  openingBalance: number;
  rows: LedgerStatementRow[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface OutstandingParams {
  search?: string;
  pageIndex: number;
  pageSize: number;
}

/** R11, R16: one party with a non-zero balance. */
export interface OutstandingRow {
  partyId: string;
  code: string;
  name: string;
  isActive: boolean;
  balance: number;
}

/** R11: one page of the outstanding list and the total of the whole list. */
export interface OutstandingPage {
  items: OutstandingRow[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalBalance: number;
}
