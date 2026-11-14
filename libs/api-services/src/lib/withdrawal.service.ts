import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/** Mirrors WithdrawalStatus on the API. */
export type WithdrawalStatus = 1 | 2 | 3 | 4 | 5;

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  4: 'Processing',
  5: 'Completed',
};

export interface WithdrawalRequestItem {
  id: number;
  registrationNumber: string;
  profileImage: string | null;
  memberName: string;
  requestedAmount: number;
  walletBalanceAtRequest: number;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  requestedOn: string;
  processedOn: string | null;
  debitedAmount: number | null;
}

export interface WithdrawalBalance {
  availableBalance: number;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private readonly api = inject(ApiService);

  /**
   * What the member can still withdraw. Money already requested is not included -- a request
   * debits the wallet immediately and is returned only if the request is rejected.
   */
  getBalance(): Observable<WithdrawalBalance> {
    return this.api.get<WithdrawalBalance>('/withdrawals/balance');
  }

  createRequest(amount: number): Observable<{ withdrawalRequestId: number }> {
    return this.api.post<{ withdrawalRequestId: number }>('/withdrawals', { amount });
  }

  getMyRequests(): Observable<WithdrawalRequestItem[]> {
    return this.api.get<WithdrawalRequestItem[]>('/withdrawals/my');
  }

  // Admin

  getRequests(status?: WithdrawalStatus): Observable<WithdrawalRequestItem[]> {
    return this.api.get<WithdrawalRequestItem[]>('/admin/withdrawals', { status });
  }

  approve(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/withdrawals/${id}/approve`, {});
  }

  reject(id: number, reason: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/withdrawals/${id}/reject`, { reason });
  }

  markPaid(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/admin/withdrawals/${id}/mark-paid`, {});
  }
}
