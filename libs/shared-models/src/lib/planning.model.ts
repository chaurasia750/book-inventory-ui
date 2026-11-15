/** Planning spec R2: one book of a class list as it is saved. */
export interface BookListLineRequest {
  itemId: string;
  quantityPerStudent: number;
}

/** Planning spec R2, R3: the whole list of one class (it replaces what is there). */
export interface SaveBookListRequest {
  studentEstimate?: number | null;
  lines: BookListLineRequest[];
}

/** Planning spec R4: copy a session's lists, from this school or another one. */
export interface CopyBookListsRequest {
  fromSchoolId?: string;
  fromSession: string;
  replaceExisting: boolean;
}

export interface CopyBookListsResponse {
  copied: string[];
  skipped: string[];
}

/** Planning spec R7: how a book differs from the previous session's list. */
export type BookListChange = 'SAME' | 'ADDED' | 'CHANGED';

export interface BookListLineView {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityPerStudent: number;
  change: BookListChange;
  previousQuantityPerStudent: number | null;
}

export interface RemovedBook {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityPerStudent: number;
}

/** Planning spec R7: one class of the school for a session. */
export interface ClassBookListView {
  className: string;
  hasList: boolean;
  studentEstimate: number | null;
  lines: BookListLineView[];
  removed: RemovedBook[];
}

export interface SchoolBookLists {
  schoolId: string;
  session: string;
  previousSession: string;
  classes: ClassBookListView[];
}
