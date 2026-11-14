import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  WITHDRAWAL_STATUS,
  WithdrawalRequestItem,
  WithdrawalService,
} from '@org/api-services';

@Component({
  selector: 'app-withdrawal',
  standalone: true,
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <div class="radius-card border border-default bg-surface p-5 shadow-card sm:p-6">
        <h2 class="font-heading text-base font-semibold text-primary-fg">Withdraw from Main Wallet</h2>

        <div class="mt-4 flex items-baseline gap-2">
          <span class="text-sm text-secondary-fg">Available</span>
          <span class="font-heading text-3xl font-semibold text-primary-fg">&#8377;{{ balance().toLocaleString() }}</span>
        </div>

        <!-- Requesting holds the money straight away, so this figure already excludes anything
             pending. Saying so avoids the "where did my balance go" support call. -->
        <p class="mt-1.5 text-xs text-muted-fg">
          Amounts you have already requested are not included here — they are held until the
          request is approved or rejected.
        </p>

        <div class="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label for="amount" class="block text-xs font-medium text-secondary-fg">Amount</label>
            <input
              id="amount"
              type="number"
              min="1"
              [(ngModel)]="amount"
              [disabled]="submitting()"
              class="mt-1.5 w-44 radius-md border border-default bg-surface px-3 py-2 text-sm text-primary-fg focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
            />
          </div>

          <button
            type="button"
            (click)="submit()"
            [disabled]="submitting() || !amount || amount <= 0 || amount > balance()"
            class="radius-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {{ submitting() ? 'Requesting…' : 'Request Withdrawal' }}
          </button>
        </div>

        @if (kycRequired()) {
          <div class="mt-4 radius-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            Please complete KYC first.
            <button type="button" (click)="goToKyc()" class="ml-1 font-semibold underline">Complete KYC →</button>
          </div>
        } @else if (error()) {
          <p class="mt-4 radius-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">{{ error() }}</p>
        }
        @if (success()) {
          <p class="mt-4 radius-md bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 dark:bg-[#66B42A]/15 dark:text-brand-300">{{ success() }}</p>
        }
      </div>

      <div class="radius-card border border-default bg-surface shadow-card">
        <div class="border-b border-light px-5 py-4">
          <h3 class="font-heading text-base font-semibold text-primary-fg">Past requests</h3>
        </div>

        @if (loading()) {
          <div class="flex items-center justify-center py-16">
            <div class="h-9 w-9 animate-spin rounded-full border-2 border-default border-t-[#66B42A]"></div>
          </div>
        } @else if (requests().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-secondary-fg">No withdrawal requests yet.</p>
        } @else {
          <div class="hidden sm:block">
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase tracking-wide text-muted-fg">
                <tr class="border-b border-light">
                  <th class="px-5 py-3 font-medium">Date</th>
                  <th class="px-5 py-3 font-medium">Amount</th>
                  <th class="px-5 py-3 font-medium">Status</th>
                  <th class="px-5 py-3 font-medium">Remark</th>
                </tr>
              </thead>
              <tbody>
                @for (item of requests(); track item.id) {
                  <tr class="border-b border-light last:border-0">
                    <td class="px-5 py-3 text-secondary-fg">{{ item.requestedOn | date: 'dd MMM yyyy' }}</td>
                    <td class="px-5 py-3 font-heading font-semibold text-primary-fg">&#8377;{{ item.requestedAmount.toLocaleString() }}</td>
                    <td class="px-5 py-3">
                      <span [class]="statusClass(item)">{{ statusLabel(item) }}</span>
                    </td>
                    <td class="px-5 py-3 text-secondary-fg">{{ item.rejectionReason || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Same four fields stacked on phones, including the rejection reason, which is the one
               a member most needs to read and the first thing a scrolling table hides. -->
          <ul class="sm:hidden">
            @for (item of requests(); track item.id) {
              <li class="border-b border-light px-5 py-3.5 last:border-0">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-heading text-sm font-semibold text-primary-fg">&#8377;{{ item.requestedAmount.toLocaleString() }}</span>
                  <span [class]="statusClass(item)">{{ statusLabel(item) }}</span>
                </div>
                <p class="mt-1 text-xs text-muted-fg">{{ item.requestedOn | date: 'dd MMM yyyy' }}</p>
                @if (item.rejectionReason) {
                  <p class="mt-1 break-words text-xs text-secondary-fg">{{ item.rejectionReason }}</p>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class WithdrawalComponent implements OnInit {
  private readonly withdrawals = inject(WithdrawalService);
  private readonly router = inject(Router);

  readonly balance = signal(0);
  readonly requests = signal<WithdrawalRequestItem[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly kycRequired = signal(false);

  amount: number | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  submit(): void {
    if (!this.amount || this.amount <= 0) return;

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    this.kycRequired.set(false);

    this.withdrawals.createRequest(this.amount).subscribe({
      next: () => {
        this.success.set('Withdrawal requested. The amount is held until an admin reviews it.');
        this.amount = null;
        this.submitting.set(false);
        this.refresh();
      },
      error: (err) => {
        const message: string = err?.error?.message ?? 'Could not create the withdrawal request.';
        if (message.toUpperCase().includes('KYC')) {
          this.kycRequired.set(true);
        } else {
          this.error.set(message);
        }
        this.submitting.set(false);
      },
    });
  }

  goToKyc(): void {
    this.router.navigate(['/documents']);
  }

  statusLabel(item: WithdrawalRequestItem): string {
    return WITHDRAWAL_STATUS[item.status] ?? 'Unknown';
  }

  statusClass(item: WithdrawalRequestItem): string {
    const base = 'radius-sm px-2.5 py-1 text-xs font-medium ';

    switch (item.status) {
      case 3:
        return base + 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
      case 5:
        return base + 'bg-brand-50 text-brand-700 dark:bg-[#66B42A]/15 dark:text-brand-300';
      case 1:
        return base + 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
      default:
        return base + 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300';
    }
  }

  private refresh(): void {
    this.loading.set(true);

    this.withdrawals.getBalance().subscribe({
      next: (result) => this.balance.set(result?.availableBalance ?? 0),
      error: () => this.balance.set(0),
    });

    this.withdrawals.getMyRequests().subscribe({
      next: (items) => {
        this.requests.set(items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.loading.set(false);
      },
    });
  }
}
