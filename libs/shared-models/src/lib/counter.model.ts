import { ItemCategory } from './item.model';

export const COUNTER_STATUSES = ['ACTIVE', 'CLOSED'] as const;
export type CounterStatus = (typeof COUNTER_STATUSES)[number];

export const COUNTER_BILL_STATUSES = ['ACTIVE', 'CANCELLED'] as const;
export type CounterBillStatus = (typeof COUNTER_BILL_STATUSES)[number];

export type CounterPaymentMode = 'CASH' | 'UPI';
export type CounterDiscountKind = 'NONE' | 'PERCENT' | 'AMOUNT';

/** One counter of the school counter sale as the list and the detail show it (sales spec R38, R49). */
export interface Counter {
  id: string;
  name: string;
  schoolId: string;
  schoolCode: string | null;
  schoolName: string | null;
  session: string;
  /** `yyyy-MM-dd`. */
  startDate: string;
  endDate: string | null;
  status: CounterStatus;
  hasBills: boolean;
  createdAt: string;
}

export interface CounterSearchParams {
  search?: string;
  schoolId?: string;
  session?: string;
  status?: CounterStatus;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** What the Owner writes for a counter; the session is the school's own on the start date unless chosen (sales spec R38). */
export interface CounterFields {
  name: string;
  schoolId: string;
  startDate: string;
  session?: string;
  endDate?: string;
}

/** One suggested student of a school while a name is typed (sales spec R41). */
export interface StudentSuggestion {
  id: string;
  name: string;
  className: string;
  section: string | null;
  rollNumber: string | null;
}

/** A student as a bill gives it: the name and class are the identity, the rest is optional (sales spec R40). */
export interface StudentInput {
  name: string;
  className: string;
  section?: string;
  rollNumber?: string;
  parentMobile?: string;
}

export interface CounterBillLineRequest {
  itemId: string;
  priceVersionId?: string;
  quantity: number;
  itemDiscount?: { kind: CounterDiscountKind; value: number };
}

export interface CounterPaymentRequest {
  mode: CounterPaymentMode;
  amount: number;
  reference?: string;
}

/** `POST counter-bills` (sales spec R42-R45). */
export interface MakeCounterBillRequest {
  counterId: string;
  lines: CounterBillLineRequest[];
  payments: CounterPaymentRequest[];
  billDate?: string;
  studentId?: string;
  student?: StudentInput;
  isGstApplied?: boolean;
  totalDiscount?: { kind: CounterDiscountKind; value: number };
  remark?: string;
}

/** The answer of making a bill: its number, its total and the stock items now at or below zero (sales spec R46). */
export interface CounterBillMade {
  counterBillId: string;
  number: string;
  grandTotal: number;
  itemsAtOrBelowZero: string[];
}

export interface CounterBillSearchParams {
  search?: string;
  counterId?: string;
  schoolId?: string;
  className?: string;
  studentId?: string;
  status?: CounterBillStatus;
  from?: string;
  to?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** One row of the bills list (sales spec R49). */
export interface CounterBillSummary {
  id: string;
  number: string;
  billDate: string;
  counterId: string;
  schoolId: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  className: string;
  grandTotal: number;
  status: CounterBillStatus;
  createdAt: string;
}

export interface CounterBillLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  priceVersionName: string;
  mrpAmount: number;
  quantity: number;
  itemDiscountKind: CounterDiscountKind;
  itemDiscountValue: number;
  grossAmount: number;
  itemDiscountAmount: number;
  lineAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

export interface CounterBillPayment {
  mode: CounterPaymentMode;
  amount: number;
  reference: string | null;
}

export interface CounterBillStudent {
  id: string;
  name: string;
  className: string;
  section: string | null;
  rollNumber: string | null;
  parentMobile: string | null;
}

/** `GET counter-bills/{id}`: a bill with its student, lines, discount, GST, round-off, grand total and payments (sales spec R49). */
export interface CounterBill {
  id: string;
  number: string;
  billDate: string;
  financialYear: string;
  counterId: string;
  counterName: string | null;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  session: string;
  student: CounterBillStudent;
  isGstApplied: boolean;
  totalDiscountKind: CounterDiscountKind;
  totalDiscountValue: number;
  subtotal: number;
  totalDiscountAmount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  remark: string | null;
  status: CounterBillStatus;
  cancelReason: string | null;
  cancelledOn: string | null;
  lines: CounterBillLine[];
  payments: CounterBillPayment[];
  createdAt: string;
}

/** `GET counter-bills/day-summary` (sales spec R50): what the live bills of a day sold. */
export interface CounterDaySummary {
  date: string;
  counterId: string | null;
  billCount: number;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  bookQuantity: number;
  totalQuantity: number;
}
