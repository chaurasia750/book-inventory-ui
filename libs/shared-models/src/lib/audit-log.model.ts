export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  timestamp: string;
  details?: string;
}

/** Who made an audit entry. A job and the hidden system account both arrive with `isSystem` and no id (core A5). */
export interface AuditActor {
  userId: string | null;
  name: string | null;
  isSystem: boolean;
}

/** One row of `GET audit` (core A3). Old and new value are JSON text, as stored. */
export interface AuditEntry {
  id: string;
  createdAt: string;
  actor: AuditActor;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  /** The company of the changed row; null for a platform row. */
  companyId: string | null;
}

/** The filters and paging of `GET audit` (core A8). */
export interface AuditSearchParams {
  /** Only a Super Admin's value counts; an Owner always gets their own company. */
  companyId?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  from?: string;
  to?: string;
  pageIndex: number;
  pageSize: number;
}
