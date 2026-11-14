export interface ApiResponse<T> {
  data: T | null;
  errorCode: number;
  errorDescription: string | null;
  message: string | null;
  isFeedbackSet: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}
