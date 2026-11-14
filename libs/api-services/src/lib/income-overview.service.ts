import { Injectable, signal, computed, inject } from '@angular/core';
import { MemberIncomeService, MemberIncomeStats } from './member-income.service';

@Injectable({ providedIn: 'root' })
export class IncomeOverviewService {
  private readonly incomeApi = inject(MemberIncomeService);
  private readonly _stats = signal<MemberIncomeStats | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private _loadedMemberId = '';

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly walletBalance = computed(() => this._stats()?.walletBalance ?? 0);
  readonly totalIncome = computed(() => this._stats()?.totalIncome ?? 0);
  readonly directMembers = computed(() => this._stats()?.directMembers ?? 0);
  readonly totalTeamMembers = computed(() => this._stats()?.totalTeamMembers ?? 0);

  load(memberId: string): void {
    if (!memberId || memberId === this._loadedMemberId) return;

    this._loadedMemberId = memberId;
    this._loading.set(true);
    this._error.set(null);

    this.incomeApi.getOverviewIncomeAmount(memberId).subscribe({
      next: (stats) => {
        this._stats.set(stats);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err?.message ?? 'Failed to load income overview');
        this._loading.set(false);
      },
    });
  }

  clear(): void {
    this._stats.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._loadedMemberId = '';
  }
}
