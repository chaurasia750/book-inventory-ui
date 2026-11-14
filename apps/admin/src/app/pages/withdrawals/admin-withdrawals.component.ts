import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  WITHDRAWAL_STATUS,
  WithdrawalRequestItem,
  WithdrawalService,
  WithdrawalStatus,
  MediaService,
} from '@org/api-services';
import { initials } from '@org/shared-utils';
import { SecureImgDirective } from '@org/directives';

@Component({
  selector: 'app-admin-withdrawals',
  standalone: true,
  imports: [DatePipe, FormsModule, SecureImgDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-lg font-semibold text-gray-900">Withdrawal Requests</h1>

        <select
          [(ngModel)]="statusFilter"
          (ngModelChange)="load()"
          class="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#66B42A] focus:outline-none"
        >
          <option [ngValue]="undefined">All</option>
          <option [ngValue]="1">Pending</option>
          <option [ngValue]="2">Approved</option>
          <option [ngValue]="3">Rejected</option>
          <option [ngValue]="5">Completed</option>
        </select>
      </div>

      @if (error()) {
        <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ error() }}</p>
      }

      <div class="rounded-2xl border border-gray-100 bg-white shadow-sm">
        @if (loading()) {
          <div class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#66B42A]"></div>
          </div>
        } @else if (requests().length === 0) {
          <p class="px-5 py-10 text-center text-sm text-gray-400">Nothing to show.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase tracking-wide text-gray-400">
                <tr class="border-b border-gray-100">
                  <th class="px-5 py-3 font-medium">Date</th>
                  <th class="px-5 py-3 font-medium">Member</th>
                  <th class="px-5 py-3 font-medium">Amount</th>
                  <th class="px-5 py-3 font-medium">Status</th>
                  <th class="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of requests(); track item.id) {
                  <tr class="border-b border-gray-50 last:border-0">
                    <td class="px-5 py-3 text-gray-600">{{ item.requestedOn | date: 'dd MMM yyyy' }}</td>
                    <td class="px-5 py-3 text-gray-600">
                      <div class="flex items-center gap-2.5">
                        @if (hasProfileImage(item.profileImage)) {
                          <img [secureSrc]="profileImageSrc(item.profileImage)" [alt]="item.memberName"
                            class="h-8 w-8 shrink-0 rounded-full object-cover" />
                        } @else {
                          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[11px] font-bold text-[#111111]">
                            {{ getInitials(item.memberName) }}
                          </div>
                        }
                        <div class="flex flex-col">
                          <span class="font-medium text-gray-900">{{ item.memberName }}</span>
                          <span class="text-xs text-gray-400">{{ item.registrationNumber }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3 font-semibold text-gray-900">&#8377;{{ item.requestedAmount.toLocaleString() }}</td>
                    <td class="px-5 py-3">
                      <span [class]="statusClass(item)">{{ statusLabel(item) }}</span>
                      @if (item.rejectionReason) {
                        <span class="ml-2 text-xs text-gray-400">{{ item.rejectionReason }}</span>
                      }
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex flex-wrap gap-2">
                        @if (item.status === 1) {
                          <button
                            type="button"
                            (click)="approve(item)"
                            [disabled]="busyId() === item.id"
                            class="rounded-lg bg-[#66B42A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#579624] disabled:bg-gray-300"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            (click)="reject(item)"
                            [disabled]="busyId() === item.id"
                            class="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-gray-300"
                          >
                            Reject
                          </button>
                        } @else if (item.status === 2) {
                          <button
                            type="button"
                            (click)="markPaid(item)"
                            [disabled]="busyId() === item.id"
                            class="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
                          >
                            Mark Paid
                          </button>
                        } @else {
                          <span class="text-xs text-gray-300">—</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminWithdrawalsComponent implements OnInit {
  private readonly withdrawals = inject(WithdrawalService);
  private readonly media = inject(MediaService);

  getInitials = initials;

  // ProfileImage is a media id, not a URL -- the same resolution members-list and the tree use.
  hasProfileImage(img: string | null): boolean {
    return !!img && /^\d+$/.test(img);
  }

  profileImageSrc(img: string | null): string {
    return this.media.getFileUrl(Number(img));
  }

  readonly requests = signal<WithdrawalRequestItem[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly error = signal('');

  statusFilter: WithdrawalStatus | undefined = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.withdrawals.getRequests(this.statusFilter).subscribe({
      next: (items) => {
        this.requests.set(items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.loading.set(false);
        this.error.set('Could not load withdrawal requests.');
      },
    });
  }

  approve(item: WithdrawalRequestItem): void {
    // The money left the member's wallet when they asked, so approving moves nothing -- it just
    // clears the request for payout.
    this.run(item, this.withdrawals.approve(item.id));
  }

  reject(item: WithdrawalRequestItem): void {
    const reason = window.prompt('Reason for rejection (required):')?.trim();
    if (!reason) return;

    // Rejecting returns the held amount to the member's Main Wallet.
    this.run(item, this.withdrawals.reject(item.id, reason));
  }

  markPaid(item: WithdrawalRequestItem): void {
    this.run(item, this.withdrawals.markPaid(item.id));
  }

  statusLabel(item: WithdrawalRequestItem): string {
    return WITHDRAWAL_STATUS[item.status] ?? 'Unknown';
  }

  statusClass(item: WithdrawalRequestItem): string {
    const base = 'rounded-full px-2.5 py-1 text-xs font-medium ';

    switch (item.status) {
      case 3:
        return base + 'bg-red-50 text-red-600';
      case 5:
        return base + 'bg-green-50 text-green-600';
      case 1:
        return base + 'bg-amber-50 text-amber-600';
      default:
        return base + 'bg-blue-50 text-blue-600';
    }
  }

  private run(item: WithdrawalRequestItem, call: { subscribe: (o: object) => void }): void {
    this.busyId.set(item.id);
    this.error.set('');

    call.subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message ?? 'The action could not be completed.');
        this.busyId.set(null);
      },
    });
  }
}
