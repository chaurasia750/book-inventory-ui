/** Sales spec R3, R7: a discount is none, a percentage or a rupee amount. */
export type DiscountKind = 'NONE' | 'PERCENT' | 'AMOUNT';

export interface Discount {
  kind: DiscountKind;
  value: number;
}

/** Sales spec R7: no GST, CGST + SGST (same state) or IGST (another state). */
export type GstMode = 'NOT_APPLIED' | 'SAME_STATE' | 'OTHER_STATE';

export type SchoolOrderStatus = 'DRAFT' | 'CONFIRMED' | 'CLOSED';
export type InvoiceStatus = 'ISSUED' | 'CANCELLED';

/** R7: the document totals, all computed by the server. */
export interface SaleTotals {
  subtotal: number;
  totalDiscount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  gst: number;
  beforeRounding: number;
}

export interface SaleLineAmounts {
  gross: number;
  itemDiscount: number;
  lineAmount: number;
  totalDiscountShare: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface SaleSchool {
  id: string;
  code: string;
  name: string;
  state: string | null;
}

export interface SaleItem {
  id: string;
  code: string;
  name: string;
  hsnCode: string | null;
  gstRatePercent: number;
}

export interface SalePrice {
  versionId: string;
  versionName: string;
  mrp: number;
  rate: number;
}

export interface SchoolOrderSummary {
  id: string;
  number: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  /** `yyyy-MM-dd`. */
  orderDate: string;
  session: string;
  status: SchoolOrderStatus;
  grandTotal: number;
}

export interface SchoolOrderLineView {
  id: string;
  item: SaleItem;
  price: SalePrice;
  quantity: number;
  itemDiscount: Discount;
  amounts: SaleLineAmounts;
  invoicedQuantity: number;
  remainingQuantity: number;
  mainStock: number | null;
  isLowStock: boolean;
  /** Sales R21: the class this line is for, or null for the school's general need. */
  className: string | null;
}

export interface InvoiceSummary {
  id: string;
  number: string;
  invoiceDate: string;
  schoolOrderId: string;
  orderNumber: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  status: InvoiceStatus;
  grandTotal: number;
}

export interface SchoolOrderDetail {
  id: string;
  number: string;
  school: SaleSchool;
  orderDate: string;
  session: string;
  isGstApplied: boolean;
  gstMode: GstMode;
  totalDiscount: Discount;
  remark: string | null;
  status: SchoolOrderStatus;
  closeReason: string | null;
  totals: SaleTotals;
  lines: SchoolOrderLineView[];
  invoices: InvoiceSummary[];
}

export interface SchoolOrderLineRequest {
  itemId: string;
  priceVersionId?: string;
  quantity: number;
  itemDiscount?: Discount;
  /** R21. */
  className?: string | null;
  /** R20: the line of a confirmed order this edits; empty adds a line. */
  lineId?: string;
}

export interface SaveSchoolOrderRequest {
  schoolId: string;
  orderDate?: string;
  session?: string;
  isGstApplied?: boolean;
  totalDiscount?: Discount;
  remark?: string;
  lines: SchoolOrderLineRequest[];
}

export interface SchoolOrderParams {
  search?: string;
  schoolId?: string;
  status?: SchoolOrderStatus;
  session?: string;
  pageIndex: number;
  pageSize: number;
}

/** School spec R18: the session of a date with the ones before and after it. */
export interface SessionChoice {
  session: string;
  previous: string;
  next: string;
}

export interface MakeInvoiceRequest {
  invoiceDate?: string;
  lines: { orderLineId: string; quantity: number }[];
}

export interface InvoiceMade {
  invoiceId: string;
  number: string;
  grandTotal: number;
  itemsAtOrBelowZero: string[];
}

export interface InvoiceParams {
  search?: string;
  schoolId?: string;
  status?: InvoiceStatus;
  financialYear?: string;
  pageIndex: number;
  pageSize: number;
}

export interface InvoiceLineView {
  id: string;
  item: SaleItem;
  price: SalePrice;
  quantity: number;
  itemDiscount: Discount;
  amounts: SaleLineAmounts;
  className: string | null;
}

/** Sales R26: an invoice is shown as a plain book list (same book merged) or grouped by class. */
export type InvoiceLayout = 'BOOK_LIST' | 'BY_CLASS';

export interface InvoiceGroupView {
  className: string | null;
  lines: InvoiceLineView[];
  subtotal: number;
}

export interface InvoiceLayoutResponse {
  schoolId: string;
  layout: InvoiceLayout;
}

/** Sales R22: one class of a class set with its number of students. */
export interface ClassSetRequest {
  className: string;
  students: number;
}

export interface AddClassSetsRequest {
  classes: ClassSetRequest[];
}

/** Sales R23: many items with one quantity and an optional class. */
export interface AddBulkLinesRequest {
  itemIds: string[];
  quantity: number;
  className?: string | null;
  itemDiscount?: Discount;
}

export interface LeftOutLine {
  itemId: string | null;
  itemCode: string | null;
  className: string | null;
  /** A message code of the errors catalogue. */
  reason: string;
}

export interface AddLinesResponse {
  linesAdded: number;
  leftOut: LeftOutLine[];
}

export interface InvoiceDetail {
  summary: InvoiceSummary;
  financialYear: string;
  school: SaleSchool;
  schoolGstin: string | null;
  companyState: string | null;
  session: string;
  isGstApplied: boolean;
  gstMode: GstMode;
  totalDiscount: Discount;
  totals: SaleTotals;
  cancelReason: string | null;
  cancelledOn: string | null;
  lines: InvoiceLineView[];
  layout: InvoiceLayout;
  groups: InvoiceGroupView[];
}

/** School spec R19: the two session cut-offs. */
export interface SessionCutOffs {
  aprMarMonth: number;
  aprMarDay: number;
  janDecMonth: number;
  janDecDay: number;
}
