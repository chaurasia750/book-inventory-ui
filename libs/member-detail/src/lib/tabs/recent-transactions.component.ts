import { ChangeDetectionStrategy, Component, inject, OnInit, Optional, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { TransactionService, TransactionItem, UserInfoService } from '@org/api-services';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-transactions.component.html',
})
export class RecentTransactionsComponent implements OnInit {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly transactionApi = inject(TransactionService);
  private readonly userInfoApi = inject(UserInfoService);

  readonly transactions = signal<TransactionItem[]>([]);
  readonly loading = signal(true);

  abs = Math.abs;

  ngOnInit(): void {
    if (this.memberId) {
      const id = this.memberId();
      if (id) {
        this.fetchTransactions(id);
      }
    } else {
      this.userInfoApi.getUserInfo().subscribe({
        next: (info) => {
          if (info.memberId) {
            this.fetchTransactions(info.memberId);
          } else {
            this.loading.set(false);
          }
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private fetchTransactions(memberId: string): void {
    this.transactionApi
      .getTransactionList(memberId, { pageIndex: 0, pageSize: 3, sortingOrder: 1 })
      .subscribe({
        next: (res) => {
          this.transactions.set(res.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
