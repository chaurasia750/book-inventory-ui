import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface MemberIncomeStats {
  walletBalance: number;
  totalIncome: number;
  teamBussiness: number;
  totalTeamMembers: number;
  directMembers: number;
}

export interface LevelIncomeOverview {
  level: number;
  memberCount: number;
  income: number;
}

/**
 * Member-facing -- no level numbers, no Company Root. Level 1 credits show
 * the enrollee's name and "Your direct referral"; everything past Level 1
 * reads generically as "Someone in your team enrolled" / "Team income".
 * See docs/requirement/Level_Income_Display_Approach.md.
 */
export interface TeamIncomeActivityItem {
  title: string;
  subtitle: string;
  occurredOn: string;
  amount: number;
}

export interface TeamIncomeSummary {
  totalTeamIncome: number;
}

export interface TeamIncomeActivityPage {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: TeamIncomeActivityItem[];
}

export interface EwalletStatus {
  levelIncome: number;
  directIncome: number;
  depositByAdmin: number;
  totalInAmount: number;
  deductByAdmin: number;
  debit: number;
  tds: number;
  adminCharge: number;
  totalOutAmount: number;
  lockAmount: number;
  availableBalance: number;
  ledgerBalance: number;
}

@Injectable({ providedIn: 'root' })
export class MemberIncomeService {
  private readonly api = inject(ApiService);

  getOverviewIncomeAmount(memberId: string): Observable<MemberIncomeStats> {
    return this.api
      .get<unknown>(`/incomes/${memberId}/overview-income-amount`)
      .pipe(map((res) => this.normalize(res)));
  }

  getLevelIncomeOverview(memberId: string): Observable<LevelIncomeOverview[]> {
    return this.api
      .get<unknown>(`/incomes/${memberId}/level-income-overview`)
      .pipe(map((res) => this.normalizeLevelArray(res)));
  }

  getTeamIncomeSummary(memberId: string): Observable<TeamIncomeSummary> {
    return this.api
      .get<unknown>(`/incomes/${memberId}/team-income-summary`)
      .pipe(map((res) => this.normalizeTeamIncomeSummary(res)));
  }

  getTeamIncomeActivity(memberId: string, page: number, pageSize: number): Observable<TeamIncomeActivityPage> {
    return this.api
      .get<unknown>(`/incomes/${memberId}/team-income-activity`, { page, pageSize })
      .pipe(map((res) => this.normalizeTeamIncomeActivityPage(res)));
  }

  getEwalletStatus(memberId: string): Observable<EwalletStatus> {
    return this.api
      .get<unknown>(`/incomes/ewallet-status/${memberId}`)
      .pipe(map((res) => this.normalizeEwalletStatus(res)));
  }

  private normalize(raw: unknown): MemberIncomeStats {
    const root = this.asObject(raw);
    const data = this.asObject(
      root.data ?? root.stats ?? root.result ?? root,
    );

    return {
      walletBalance: this.toNumber(data.walletBalance ?? data.wallet_balance) ?? 0,
      totalIncome: this.toNumber(data.totalIncome ?? data.total_income) ?? 0,
      teamBussiness: this.toNumber(data.teamBussiness ?? data.team_business) ?? 0,
      totalTeamMembers: this.toNumber(data.totalTeamMembers ?? data.total_team_members) ?? 0,
      directMembers: this.toNumber(data.directMembers ?? data.direct_members) ?? 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private asObject(value: unknown): any {
    return value && typeof value === 'object' ? value : {};
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private normalizeLevelArray(raw: unknown): LevelIncomeOverview[] {
    const root = this.asObject(raw);
    const arr: unknown[] = root.data ?? root.result ?? root;
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      const obj = this.asObject(item);
      return {
        level: this.toNumber(obj.level) ?? 0,
        memberCount: this.toNumber(obj.memberCount ?? obj.member_count) ?? 0,
        income: this.toNumber(obj.income) ?? 0,
      };
    });
  }

  private normalizeTeamIncomeSummary(raw: unknown): TeamIncomeSummary {
    const root = this.asObject(raw);
    const data = this.asObject(root.data ?? root.result ?? root);

    return {
      totalTeamIncome: this.toNumber(data.totalTeamIncome) ?? 0,
    };
  }

  private normalizeTeamIncomeActivityPage(raw: unknown): TeamIncomeActivityPage {
    const root = this.asObject(raw);
    const data = this.asObject(root.data ?? root.result ?? root);
    const items: unknown[] = Array.isArray(data.items) ? data.items : [];

    return {
      page: this.toNumber(data.page) ?? 1,
      pageSize: this.toNumber(data.pageSize) ?? 20,
      totalRecords: this.toNumber(data.totalRecords) ?? 0,
      totalPages: this.toNumber(data.totalPages) ?? 0,
      items: items.map((item) => {
        const obj = this.asObject(item);
        return {
          title: (obj.title as string) ?? '',
          subtitle: (obj.subtitle as string) ?? '',
          occurredOn: (obj.occurredOn as string) ?? '',
          amount: this.toNumber(obj.amount) ?? 0,
        };
      }),
    };
  }

  private normalizeEwalletStatus(raw: unknown): EwalletStatus {
    const root = this.asObject(raw);
    const data = this.asObject(root.data ?? root.result ?? root);

    return {
      levelIncome: this.toNumber(data.levelIncome ?? data.level_income) ?? 0,
      directIncome: this.toNumber(data.directIncome ?? data.direct_income) ?? 0,
      depositByAdmin: this.toNumber(data.depositByAdmin ?? data.deposit_by_admin) ?? 0,
      totalInAmount: this.toNumber(data.totalInAmount ?? data.total_in_amount) ?? 0,
      deductByAdmin: this.toNumber(data.deductByAdmin ?? data.deduct_by_admin) ?? 0,
      debit: this.toNumber(data.debit) ?? 0,
      tds: this.toNumber(data.tds) ?? 0,
      adminCharge: this.toNumber(data.adminCharge ?? data.admin_charge) ?? 0,
      totalOutAmount: this.toNumber(data.totalOutAmount ?? data.total_out_amount) ?? 0,
      lockAmount: this.toNumber(data.lockAmount ?? data.lock_amount) ?? 0,
      availableBalance: this.toNumber(data.availableBalance ?? data.available_balance) ?? 0,
      ledgerBalance: this.toNumber(data.ledgerBalance ?? data.ledger_balance) ?? 0,
    };
  }
}
