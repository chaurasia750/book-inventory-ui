/** How money came (payment spec R5, BRD 4.14 A). */
export type PaymentModeType = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export const PAYMENT_MODE_TYPES: readonly PaymentModeType[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

/** Payment spec R10: the status of a cheque. */
export type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED';

/** Payment spec R14: a receipt is recorded or cancelled. */
export type ReceiptStatus = 'RECORDED' | 'CANCELLED';

/** Payment spec R10 limit: a receipt has one to ten modes. */
export const MAX_RECEIPT_MODES = 10;

/** One mode of a new receipt (R5): the reference is the UPI id or the UTR; a cheque has its number, date and bank. */
export interface ReceiptModeRequest {
  type: PaymentModeType;
  amount: number;
  reference?: string;
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
}

/** R6: an amount the Owner applies to one invoice by hand. */
export interface ReceiptAllocationRequest {
  invoiceId: string;
  amount: number;
}

/** R4-R9: a new school payment; `clientRequestId` makes a retry harmless (R9); no allocations means oldest invoice first (R6). */
export interface RecordReceiptRequest {
  clientRequestId: string;
  schoolId: string;
  /** `yyyy-MM-dd`; today when left out. */
  receiptDate?: string;
  modes: ReceiptModeRequest[];
  allocations?: ReceiptAllocationRequest[];
  remark?: string;
}

/** R16: one row of the receipt list. */
export interface ReceiptSummary {
  id: string;
  number: string;
  receiptDate: string;
  schoolId: string;
  schoolCode: string | null;
  schoolName: string | null;
  totalAmount: number;
  status: ReceiptStatus;
}

export interface ReceiptModeDetail {
  id: string;
  type: PaymentModeType;
  amount: number;
  reference: string | null;
  chequeNumber: string | null;
  chequeDate: string | null;
  bankName: string | null;
  chequeStatus: ChequeStatus | null;
}

/** R6, R16: what a receipt applied to one invoice. */
export interface ReceiptAllocationDetail {
  invoiceId: string;
  invoiceNumber: string | null;
  amount: number;
}

/** R16: a receipt with its modes, allocations and advance. */
export interface ReceiptDetail {
  summary: ReceiptSummary;
  remark: string | null;
  allocatedAmount: number;
  advanceAmount: number;
  modes: ReceiptModeDetail[];
  allocations: ReceiptAllocationDetail[];
}

/** R3: an open invoice of a school with what was applied and what is still due. */
export interface OpenInvoice {
  invoiceId: string;
  number: string;
  invoiceDate: string;
  grandTotal: number;
  allocated: number;
  due: number;
}

/** R3: a school's balance (negative after an advance) and its open invoices, oldest first. */
export interface SchoolDues {
  schoolId: string;
  balance: number;
  openInvoices: OpenInvoice[];
}

/** R16: allocated and due amounts of an invoice. */
export interface InvoiceDue {
  invoiceId: string;
  grandTotal: number;
  allocated: number;
  due: number;
}

export interface ReceiptSearchParams {
  search?: string;
  schoolId?: string;
  status?: ReceiptStatus;
  from?: string;
  to?: string;
  mode?: PaymentModeType;
  chequeStatus?: ChequeStatus;
  pageIndex: number;
  pageSize: number;
}
