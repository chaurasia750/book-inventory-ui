import { ItemCategory } from './item.model';

/** One version of one item as the API returns it; the purchase price is null for Staff (price spec R5). */
export interface PriceVersion {
  id: string;
  itemId: string;
  versionName: string;
  /** `yyyy-MM-dd`. */
  effectiveFrom: string;
  mrpAmount: number;
  saleAmount: number;
  purchaseAmount: number | null;
  isDefault: boolean;
}

/** The values of a version an Owner writes (price spec R2). */
export interface PriceVersionFields {
  versionName: string;
  effectiveFrom: string;
  mrpAmount: number;
  saleAmount: number;
  purchaseAmount: number;
}

/** One row of `GET prices`: the item and its default version, or none (R9). */
export interface PriceListRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  defaultVersion: PriceVersion | null;
}

export interface PriceListParams {
  search?: string;
  category?: ItemCategory;
  vendorId?: string;
  className?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** Which items a copy or a bulk change means; empty means every item (R8, R10). */
export interface PriceSelection {
  vendorId?: string;
  category?: ItemCategory;
  className?: string;
  onlyActive?: boolean;
}

export interface CopyPriceRequest {
  fromVersionName: string;
  toVersionName: string;
  effectiveFrom: string;
  selection?: PriceSelection;
}

/** How many items a copy touched (R8). */
export interface CopyPriceResult {
  itemsSelected: number;
  copied: number;
  skippedNoSourceVersion: number;
  skippedAlreadyHasTarget: number;
}

export type PriceChangeKind = 'PERCENT' | 'AMOUNT';
export type PriceChangeDirection = 'INCREASE' | 'DECREASE';

/** One change of one price field (R11). */
export interface PriceChange {
  kind: PriceChangeKind;
  direction: PriceChangeDirection;
  value: number;
}

export interface BulkPriceRequest {
  versionName: string;
  selection?: PriceSelection;
  mrp?: PriceChange;
  sale?: PriceChange;
  purchase?: PriceChange;
  pageIndex?: number;
  pageSize?: number;
}

export interface PriceTriple {
  mrpAmount: number;
  saleAmount: number;
  purchaseAmount: number;
}

export type BulkSkipReason = 'NO_VERSION' | 'BELOW_ZERO' | 'OVERFLOW';

export interface BulkPreviewRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  versionId: string | null;
  old: PriceTriple | null;
  new: PriceTriple | null;
  skipped: BulkSkipReason | null;
}

export interface BulkTotals {
  itemsSelected: number;
  changed: number;
  skippedNoVersion: number;
  skippedBelowZero: number;
  skippedOverflow: number;
}

export interface BulkPreviewResult {
  rows: BulkPreviewRow[];
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  totals: BulkTotals;
}
