import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IamSelfService } from '@org/api-services';
import { LoginHistoryItem, PagedList } from '@org/shared-models';
import { loginResultBadgeClass } from '@org/shared-utils';
import { PaginationComponent } from '@org/ui';

const PAGE_SIZE = 20;

/**
 * "Login history" (spec R26): the caller's own sign-in attempts, newest first - when, whether it worked, from which browser,
 * operating system, device and address, and, for a successful one, when and why it ended. The duration is the difference of the
 * two times, computed here; nothing about it is stored.
 */
@Component({
  selector: 'lib-login-history-screen',
  standalone: true,
  imports: [DatePipe, TranslatePipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-6xl">
      <div class="rounded-2xl border border-default bg-surface p-5 shadow-xl sm:p-8">
        <h2 class="mb-6 text-2xl font-bold text-primary-fg">{{ 'account.history.title' | translate }}</h2>
        <div class="overflow-x-auto rounded-xl border border-default">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-500/5 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.when' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.result' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.browser' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.ip' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.ended' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'account.history.duration' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default/60">
              @for (row of result()?.items ?? []; track row.id) {
                <tr class="transition-colors hover:bg-gray-500/5">
                  <td class="whitespace-nowrap px-4 py-3 text-gray-500">{{ row.loginAt | date: 'medium' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="resultClass(row.result)">{{ 'account.result.' + row.result | translate }}</span>
                    @if (row.isNewDevice) { <span class="ml-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-500">{{ 'account.history.newDevice' | translate }}</span> }
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ row.browserName ?? '-' }} &middot; {{ row.osName ?? '-' }} <span class="text-xs text-gray-400">({{ 'account.device.' + row.deviceType | translate }})</span></td>
                  <td class="px-4 py-3 text-gray-500">{{ row.ipAddress ?? '-' }}</td>
                  <td class="px-4 py-3 text-gray-500">
                    @if (row.loggedOutAt) { {{ row.loggedOutAt | date: 'medium' }} <span class="text-xs text-gray-400">({{ 'account.reason.' + row.logoutReason | translate }})</span> } @else { - }
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ duration(row) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-10 text-center text-sm text-gray-400">{{ 'account.history.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goTo($event)" />
      </div>
    </div>
  `,
})
export class LoginHistoryScreenComponent {
  private readonly self = inject(IamSelfService);

  readonly pageSize = PAGE_SIZE;
  readonly page = signal(1);
  readonly result = signal<PagedList<LoginHistoryItem> | null>(null);

  constructor() {
    this.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  resultClass(result: LoginHistoryItem['result']): string {
    return loginResultBadgeClass(result);
  }

  /** The time a session lasted, from the two stored times; empty when it has not ended or the attempt was refused. */
  duration(row: LoginHistoryItem): string {
    if (!row.loggedOutAt) return '-';
    const minutes = Math.max(0, Math.round((new Date(row.loggedOutAt).getTime() - new Date(row.loginAt).getTime()) / 60000));
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }

  private load(): void {
    this.self.loginHistory(this.page(), PAGE_SIZE).subscribe((result) => this.result.set(result));
  }
}
