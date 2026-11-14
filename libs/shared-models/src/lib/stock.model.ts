import { ItemCategory } from './item.model';

/** Stock spec R3: the three stocks kept apart. */
export type StockType = 'MAIN' | 'DAMAGED' | 'SAMPLE';

export const STOCK_TYPES: readonly StockType[] = ['MAIN', 'DAMAGED', 'SAMPLE'];

/** Stock spec R5: why an entry was posted. */
export type MovementKind =
  | 'OPENING'
  | 'ADJUSTMENT'
  | 'PURCHASE'
  | 'SCHOOL_INVOICE'
  | 'COUNTER_SALE'
  | 'SCHOOL_RETURN_GOOD'
  | 'SCHOOL_RETURN_DAMAGED'
  | 'VENDOR_RETURN'
  | 'SAMPLE_FROM_VENDOR'
  | 'SAMPLE_TO_SCHOOL'
  | 'SAMPLE_FROM_SCHOOL'
  | 'SAMPLE_TO_VENDOR'
  | 'REVERSAL';

/** One row of `GET stock` (R9, R10): the warning mark is set when Main is zero or below. */
export interface StockListRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  isActive: boolean;
  mainQuantity: number;
  damagedQuantity: number;
  sampleQuantity: number;
  isAtOrBelowZero: boolean;
}

export interface StockListParams {
  search?: string;
  category?: ItemCategory;
  vendorId?: string;
  className?: string;
  atOrBelowZeroOnly?: boolean;
  includeInactive?: boolean;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** One entry of an item's history, with the quantity of its stock type after it (R4, R10, R13). */
export interface StockEntry {
  id: string;
  stockType: StockType;
  movementKind: MovementKind;
  quantityIn: number;
  quantityOut: number;
  quantityAfter: number;
  /** `yyyy-MM-dd`. */
  movementDate: string;
  documentType: string | null;
  documentNumber: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string;
  createdByName: string | null;
}

/** `GET items/{id}/stock`: the three quantities and the history newest first (R10). */
export interface ItemStock {
  itemId: string;
  itemCode: string;
  itemName: string;
  isActive: boolean;
  mainQuantity: number;
  damagedQuantity: number;
  sampleQuantity: number;
  entries: StockEntry[];
}

/** R7: the opening of one stock type. */
export interface EnterOpeningRequest {
  stockType: StockType;
  quantity: number;
  openingDate: string;
}

/** R8: the counted quantity after a physical count, and why. */
export interface AdjustStockRequest {
  stockType: StockType;
  countedQuantity: number;
  reason: string;
}

/** R7, R8: the entry just posted and the quantity after it. */
export interface StockPosted {
  entryId: string;
  itemId: string;
  stockType: StockType;
  movementKind: MovementKind;
  quantityIn: number;
  quantityOut: number;
  quantity: number;
}

/** R18: one wrong row of an import file. */
export interface OpeningImportRowError {
  rowNumber: number;
  column: 'ItemCodeOrBarcode' | 'StockType' | 'Quantity';
  code: string;
}

/** R17, R18: how many openings were imported. */
export interface OpeningImportResult {
  imported: number;
}
