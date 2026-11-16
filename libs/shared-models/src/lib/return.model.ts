import { CounterDiscountKind } from './counter.model';

/** Sales spec R56: why the school gives the books back; once per credit note. */
export const CREDIT_NOTE_REASONS = ['SESSION_END', 'DAMAGED', 'WRONG_BOOK', 'OTHER'] as const;
export type CreditNoteReason = (typeof CREDIT_NOTE_REASONS)[number];

/** Sales spec R54, R57: a returned line is good (Main stock) or damaged (Damaged stock). */
export const RETURN_CONDITIONS = ['GOOD', 'DAMAGED'] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export const RETURN_STATUSES = ['ACTIVE', 'CANCELLED'] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** Sales spec R64 (Q41): how a refund is paid. */
export const REFUND_MODES = ['CASH', 'UPI', 'BANK_TRANSFER'] as const;
export type RefundMode = (typeof REFUND_MODES)[number];

/** R54: one returned line; with an invoice the invoice line, without one the item (and optionally a changed rate). */
export interface CreditNoteLineRequest {
  quantity: number;
  condition: ReturnCondition;
  invoiceLineId?: string;
  itemId?: string;
  rate?: number;
}

/** R53-R56: a new credit note. */
export interface MakeCreditNoteRequest {
  schoolId: string;
  reason: CreditNoteReason;
  lines: CreditNoteLineRequest[];
  invoiceId?: string;
  noteDate?: string;
  isGstApplied?: boolean;
  remark?: string;
}

/** R57: the credit note made and the items returned beyond what was sold (a warning, R54). */
export interface CreditNoteMade {
  creditNoteId: string;
  number: string;
  grandTotal: number;
  overReturnedItemIds: string[];
}

export interface CreditNoteSearchParams {
  search?: string;
  schoolId?: string;
  invoiceId?: string;
  status?: ReturnStatus;
  reason?: CreditNoteReason;
  session?: string;
  from?: string;
  to?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** R61: one row of the credit note list. */
export interface CreditNoteSummary {
  id: string;
  number: string;
  noteDate: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  invoiceNumber: string | null;
  reason: CreditNoteReason;
  grandTotal: number;
  status: ReturnStatus;
  createdAt: string;
}

export interface CreditNoteLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  priceVersionName: string;
  mrpAmount: number;
  rateAmount: number;
  quantity: number;
  condition: ReturnCondition;
  itemDiscountKind: CounterDiscountKind;
  itemDiscountValue: number;
  grossAmount: number;
  itemDiscountAmount: number;
  lineAmount: number;
  totalDiscountShareAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

/** R61: one credit note with its lines and totals. */
export interface CreditNote {
  id: string;
  number: string;
  noteDate: string;
  financialYear: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  session: string;
  isGstApplied: boolean;
  reason: CreditNoteReason;
  remark: string | null;
  subtotal: number;
  totalDiscount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  status: ReturnStatus;
  cancelReason: string | null;
  cancelledOn: string | null;
  lines: CreditNoteLine[];
  createdAt: string;
}

/** R54: an invoice line with what was sold, returned and can still be returned. */
export interface ReturnableLine {
  invoiceLineId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  className: string | null;
  rateAmount: number;
  soldQuantity: number;
  returnedQuantity: number;
  returnableQuantity: number;
}

/** R54, R61: the invoice's returnable lines and the credit notes made against it. */
export interface InvoiceReturns {
  invoiceId: string;
  invoiceNumber: string;
  lines: ReturnableLine[];
  creditNotes: CreditNoteSummary[];
}

/** R64: a new refund. */
export interface RecordRefundRequest {
  schoolId: string;
  amount: number;
  mode: RefundMode;
  reference?: string;
  refundDate?: string;
  creditNoteId?: string;
  remark?: string;
}

export interface RefundMade {
  refundId: string;
  number: string;
  amount: number;
}

export interface RefundSearchParams {
  search?: string;
  schoolId?: string;
  creditNoteId?: string;
  status?: ReturnStatus;
  from?: string;
  to?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** R69: one refund (the list row and the detail are the same). */
export interface Refund {
  id: string;
  number: string;
  refundDate: string;
  financialYear: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  creditNoteId: string | null;
  creditNoteNumber: string | null;
  mode: RefundMode;
  reference: string | null;
  amount: number;
  remark: string | null;
  status: ReturnStatus;
  cancelReason: string | null;
  cancelledOn: string | null;
  createdAt: string;
}
