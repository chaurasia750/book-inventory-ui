import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Backs Tasks 2-6 of Member_Pool_API_And_UI_Plan.md plus Tasks D1/D2 of
 * Member_Dashboard_Rebuild_Plan.md -- what a member reads about their own pool standing.
 * MemberSummary/ActivityItem are shaped to match docs/requirements/Member_Dashboard_API_Spec.md
 * exactly.
 */

export interface MemberInfo {
  regNo: number;
  registrationNumber: string | null;
  name: string;
  joinedOn: string | null;
  status: 'ACTIVE' | 'PENDING' | string;
}

export interface LadderRung {
  level: number;
  state: 'DONE' | 'CURRENT' | 'LOCKED';
  incomeEarned: number | null;
  incomeOnComplete: number | null;
  completedOn: string | null;
}

export interface LevelProgress {
  level: number;
  collectedAmount: number;
  requiredAmount: number;
  qualifiedMembers: number;
  requiredMembers: number;
  fillPercent: number;
  incomeOnComplete: number;
  nextLevel: number | null;
}

export interface LevelBreakupRow {
  level: number;
  amount: number;
}

export interface MainWalletSummary {
  balance: number;
  canWithdraw: boolean;
  levelBreakup: LevelBreakupRow[];
}

export interface PoolContribution {
  memberCode: string;
  amount: number;
  receivedOn: string;
}

export interface LevelPoolSummary {
  level: number;
  balance: number;
  withdrawable: boolean;
  contributions: PoolContribution[];
}

export interface WeeklyMovement {
  newMembers: number;
  earned: number;
}

export interface TeamStats {
  direct: number;
  total: number;
  left: number;
  right: number;
}

export interface MemberSummary {
  member: MemberInfo;
  currentLevel: number;
  ladder: LadderRung[];
  currentLevelProgress: LevelProgress;
  mainWallet: MainWalletSummary;
  levelPool: LevelPoolSummary | null;
  team: TeamStats;
  thisWeek: WeeklyMovement;
}

export interface ActivityItem {
  type: 'POOL_CREDIT' | 'LEVEL_COMPLETE' | 'WITHDRAWAL_REQUESTED' | 'WITHDRAWAL_PAID' | 'WITHDRAWAL_REJECTED';
  title: string;
  date: string;
  amount: number;
  level: number | null;
  display: string;
  affectsMainWallet: boolean;
}

export interface TreeNode {
  regNo: number;
  registrationNumber: string | null;
  name: string;
  position: number;
  parentPosition: number | null;
  currentLevel: number;
  depth: number;
  hasChildren: boolean;
}

export interface TeamMemberRow {
  regNo: number;
  profileImage: string | null;
  registrationNumber: string | null;
  name: string;
  currentLevel: number;
  depth: number;
  joinedOn: string | null;
  side: 'Left' | 'Right';
}

export interface TeamList {
  directCount: number;
  totalTeamCount: number;
  leftLegCount: number;
  rightLegCount: number;
  totalItems: number;
  items: TeamMemberRow[];
}

export interface LevelIncomeRow {
  levelNo: number;
  state: 'DONE' | 'CURRENT' | 'LOCKED';
  /** Actually paid into the Main Wallet; null until the level completes. */
  earned: number | null;
  /** What completing this level pays; null once it has completed. */
  payableOnComplete: number | null;
  completedOn: string | null;
  receivedMembers: number;
  requiredMembers: number;
  /** Collected into this level's pool so far. */
  collectedAmount: number;
  /** What the level needs in total before it completes. */
  requiredAmount: number;
  /** Sent upward on completion; the remainder is the member's share. */
  transferAmount: number;
  /** How far up that transfer travels. The recipient is never identified. */
  stepsUp: number;
}

export interface WalletLedgerEntry {
  occurredOn: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  levelNo: number;
}

/**
 * The level-by-level earnings report. No transaction list on purpose -- those rows are the Main
 * Wallet ledger and belong to the Wallet screen.
 */
export interface IncomeStatement {
  totalEarned: number;
  pendingFromCurrentLevel: number;
  currentLevel: number;
  levelSummary: LevelIncomeRow[];
}

export interface UpgradeHistoryEntry {
  levelNo: number;
  nextLevelNo: number;
  amountTransferred: number;
  stepsUp: number;
  mainWalletIncome: number;
  completedOn: string | null;
}

@Injectable({ providedIn: 'root' })
export class PoolMemberService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<MemberSummary> {
    return this.api.get<MemberSummary>('/pool/member/summary');
  }

  getActivity(limit = 10): Observable<ActivityItem[]> {
    return this.api.get<ActivityItem[]>('/pool/member/activity', { limit });
  }

  getTree(rootRegNo?: number, depth = 3): Observable<TreeNode[]> {
    const params: Record<string, string | number> = { depth };
    if (rootRegNo) params['rootRegNo'] = rootRegNo;
    return this.api.get<TreeNode[]>('/pool/member/tree', params);
  }

  getTeam(options: { search?: string; level?: number; page?: number; pageSize?: number } = {}): Observable<TeamList> {
    const params: Record<string, string | number> = {
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 20,
    };
    if (options.search) params['search'] = options.search;
    if (options.level !== undefined) params['level'] = options.level;
    return this.api.get<TeamList>('/pool/member/team', params);
  }

  getIncome(): Observable<IncomeStatement> {
    return this.api.get<IncomeStatement>('/pool/member/income');
  }

  getWalletLedger(wallet: 'main' | 'upgrade', from?: string, to?: string): Observable<WalletLedgerEntry[]> {
    const params: Record<string, string> = { wallet };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.api.get<WalletLedgerEntry[]>('/pool/member/wallet-ledger', params);
  }

  getUpgradeHistory(): Observable<UpgradeHistoryEntry[]> {
    return this.api.get<UpgradeHistoryEntry[]>('/pool/member/upgrade-history');
  }
}
