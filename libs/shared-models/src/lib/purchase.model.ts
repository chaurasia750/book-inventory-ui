import { ReturnStatus } from './return.model';

/** Purchase spec R4: where a returned line leaves from: Main stock or Damaged stock. */
export const RETURN_STOCK_SOURCES = ['MAIN', 'DAMAGED'] as const;
export type ReturnStockSource = (typeof RETURN_STOCK_SOURCES)[number];

/** R4: one returned line: the item, the quantity, the stock source and optionally a changed rate (empty: the item's purchase price). */
export interface VendorReturnLineRequest {
  itemId: string;
  quantity: number;
  stockSource: ReturnStockSource;
  rate?: number;
}

/** R2-R5: a new vendor return. */
export interface MakeVendorReturnRequest {
  vendorId: string;
  lines: VendorReturnLineRequest[];
  returnDate?: string;
  remark?: string;
}

/** R6: the vendor return made and the items whose stock went to zero or below (a notice, never a refusal). */
export interface VendorReturnMade {
  vendorReturnId: string;
  number: string;
  grandTotal: number;
  itemsAtOrBelowZero: string[];
}

export interface VendorReturnSearchParams {
  search?: string;
  vendorId?: string;
  status?: ReturnStatus;
  from?: string;
  to?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** R12: one row of the list. */
export interface VendorReturnSummary {
  id: string;
  number: string;
  returnDate: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  grandTotal: number;
  status: ReturnStatus;
  createdAt: string;
}

export interface VendorReturnLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  stockSource: ReturnStockSource;
  rateAmount: number;
  quantity: number;
  lineAmount: number;
}

/** R12: one vendor return with its lines and totals. */
export interface VendorReturn {
  id: string;
  number: string;
  returnDate: string;
  financialYear: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  remark: string | null;
  subtotal: number;
  roundOff: number;
  grandTotal: number;
  status: ReturnStatus;
  cancelReason: string | null;
  cancelledOn: string | null;
  lines: VendorReturnLine[];
  createdAt: string;
}
