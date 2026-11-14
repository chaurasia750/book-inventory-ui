import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Backs Part 3 of book-inventory-api/docs/plan/Admin_Dashboard_And_Reports_Plan.md. Field shapes mirror
 * Binsera.Core.AdminDashboard.Models exactly, including the two flagged-unavailable inflow fields.
 */
export interface ReconciliationInflow {
  newMembers: number;
  /** Always 0: no table records the full registration amount, only the pool's own Rs.15 slice. */
  joiningCollected: number;
  /** Always 0, same reason as joiningCollected. */
  productAndMargin: number;
  poolContribution: number;
}

export interface ReconciliationOutflow {
  toMemberMainWallets: number;
  toCompanyWallet: number;
  unallocated: number;
  totalOut: number;
}

export interface ReconciliationResponse {
  from: string;
  to: string;
  inflow: ReconciliationInflow;
  outflow: ReconciliationOutflow;
  isBalanced: boolean;
  difference: number;
  mismatchTransactionIds: number[];
}

export interface DashboardQueue {
  withdrawalsPending: number;
  withdrawalsPendingAmount: number;
  kycPending: number;
  bankVerifyPending: number;
  failedJobs: number;
  oldestPendingWithdrawalDays: number;
}

export interface DashboardPosition {
  memberLiability: number;
  companyWallet: number;
  totalWithdrawn: number;
  stuckInLevelPools: number;
  asOn: string;
}

export interface JoiningDayCount {
  date: string;
  count: number;
}

export interface JoiningsResponse {
  series: JoiningDayCount[];
  total: number;
  dailyAverage: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface LevelDistributionRow {
  level: number;
  count: number;
  percent: number;
}

export interface DashboardLevelDistribution {
  totalMembers: number;
  levels: LevelDistributionRow[];
}

export interface TreeHealthLastRow {
  row: number;
  capacity: number;
  filled: number;
  fillPercent: number;
}

export interface TreeHealthNextPlacement {
  parentCode: string | null;
  side: 'LEFT' | 'RIGHT';
  row: number;
}

export interface TreeHealthResponse {
  treeDepth: number;
  lastRow: TreeHealthLastRow;
  nextPlacement: TreeHealthNextPlacement | null;
  membersInBottomTwoRows: number;
  bottomTwoRowsPercent: number;
}

export interface StuckMemberRow {
  memberRegNo: number;
  registrationNumber: string | null;
  name: string;
  currentLevel: number;
  qualifiedMembers: number;
  requiredMembers: number;
  daysAtLevel: number;
  totalEarned: number;
  riskBand: 'RISK' | 'WATCH' | 'NORMAL';
  mobile: string | null;
}

export interface StuckMembersResponse {
  items: StuckMemberRow[];
  totalStuck: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(ApiService);

  getReconciliation(date?: string): Observable<ReconciliationResponse> {
    return this.api.get<ReconciliationResponse>('/admin/dashboard/reconciliation', { date });
  }

  getQueue(): Observable<DashboardQueue> {
    return this.api.get<DashboardQueue>('/admin/dashboard/queue');
  }

  getPosition(): Observable<DashboardPosition> {
    return this.api.get<DashboardPosition>('/admin/dashboard/position');
  }

  getJoinings(days = 14): Observable<JoiningsResponse> {
    return this.api.get<JoiningsResponse>('/admin/dashboard/joinings', { days });
  }

  getLevelDistribution(): Observable<DashboardLevelDistribution> {
    return this.api.get<DashboardLevelDistribution>('/admin/dashboard/level-distribution');
  }

  getTreeHealth(): Observable<TreeHealthResponse> {
    return this.api.get<TreeHealthResponse>('/admin/dashboard/tree-health');
  }

  getStuckMembers(minDays = 25, limit = 10): Observable<StuckMembersResponse> {
    return this.api.get<StuckMembersResponse>('/admin/dashboard/stuck-members', { minDays, limit });
  }
}
