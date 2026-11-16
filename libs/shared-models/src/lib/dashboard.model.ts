/** Report spec R13: one part of the dashboard: its figures, or the code of the error when that part could not be read. */
export interface DashboardPart<T> {
  data: T | null;
  error: string | null;
}

export interface DashboardSessionChoice {
  label: string;
  isCurrent: boolean;
}

export type DashboardModeType = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

/** R4-R6: the payments card (the Owner's). */
export interface DashboardPayments {
  received: { total: number; byMode: { mode: DashboardModeType; amount: number }[]; receipts: number };
  pendingCheques: { count: number; amount: number };
  earlierSessions: { amount: number; schools: number; stillDue: number };
}

export type DashboardOrderStatus = 'DRAFT' | 'CONFIRMED' | 'CLOSED';

/** R7: the orders and invoices card. */
export interface DashboardOrders {
  byStatus: { status: DashboardOrderStatus; count: number; total: number }[];
  stillToInvoiceQuantity: number;
  invoicesLive: number;
  invoicesTotal: number;
  invoicesCancelled: number;
}

export interface DashboardSalesFigure {
  invoices: number;
  invoicesTotal: number;
  counterBills: number;
  counterTotal: number;
  total: number;
}

/** R8: the sales card. */
export interface DashboardSales {
  today: DashboardSalesFigure;
  session: DashboardSalesFigure;
  days: { date: string; total: number }[];
}

/** R8: the returns and refunds card (the Owner's). */
export interface DashboardReturns {
  creditNotes: number;
  creditNotesTotal: number;
  refunds: number;
  refundsTotal: number;
  vendorReturns: number;
  vendorReturnsTotal: number;
}

export interface DashboardOwedRow {
  partyId: string;
  code: string;
  name: string;
  balance: number;
}

export interface DashboardOwedGroup {
  count: number;
  total: number;
  largest: DashboardOwedRow[];
}

/** R9: what is owed (the Owner's). */
export interface DashboardOwed {
  schoolsOwing: DashboardOwedGroup;
  schoolsInAdvance: DashboardOwedGroup;
  vendorsOwed: DashboardOwedGroup;
}

/** R10: the stock card (the value is the Owner's). */
export interface DashboardStock {
  atOrBelowZero: number;
  belowZero: number;
  damagedPieces: number;
  value: number | null;
  itemsWithoutPrice: number | null;
}

/** R13: the dashboard; a part the caller may not see is null. */
export interface Dashboard {
  session: string;
  from: string;
  to: string;
  today: string;
  sessions: DashboardSessionChoice[];
  payments: DashboardPart<DashboardPayments> | null;
  orders: DashboardPart<DashboardOrders>;
  sales: DashboardPart<DashboardSales>;
  returns: DashboardPart<DashboardReturns> | null;
  owed: DashboardPart<DashboardOwed> | null;
  stock: DashboardPart<DashboardStock>;
}
