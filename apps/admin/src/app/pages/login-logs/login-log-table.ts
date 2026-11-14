import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginLogItem } from '@org/shared-models';
import { loginResultBadgeClass } from '@org/shared-utils';

/**
 * The rows of the login log (spec R22, R26) as the Super Admin reads them: who, what was tried, whether it worked, the
 * browser, operating system, device and address, and how a session ended. The hidden system account (R48) arrives as
 * <code>isSystem</code> without a name and is shown under one fixed label. Used by the login-log page and by the login-log
 * section of the user detail page, so the two can never show a row differently.
 */
@Component({
  selector: 'app-login-log-table',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3 font-semibold">{{ 'account.history.when' | translate }}</th>
            <th class="px-4 py-3 font-semibold">{{ 'loginLogs.user' | translate }}</th>
            <th class="px-4 py-3 font-semibold">{{ 'account.history.result' | translate }}</th>
            <th class="px-4 py-3 font-semibold">{{ 'account.history.browser' | translate }}</th>
            <th class="px-4 py-3 font-semibold">{{ 'account.history.ip' | translate }}</th>
            <th class="px-4 py-3 font-semibold">{{ 'account.history.ended' | translate }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (row of rows(); track row.id) {
            <tr class="transition-colors hover:bg-gray-50/60">
              <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ row.loginAt | date: 'medium' }}</td>
              <td class="px-4 py-3">
                @if (row.actor.isSystem) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium italic text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M8 8V6a4 4 0 118 0v2" /></svg>
                    {{ 'loginLogs.system' | translate }}
                  </span>
                } @else {
                  <span class="font-medium text-primary-fg">{{ row.actor.userName ?? '-' }}</span>
                }
                <div class="text-xs text-gray-500">{{ row.identifierAttempted }}</div>
              </td>
              <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="resultClass(row.result)">{{ 'account.result.' + row.result | translate }}</span></td>
              <td class="px-4 py-3 text-gray-600">{{ row.browserName ?? '-' }} &middot; {{ row.osName ?? '-' }} <span class="text-xs text-gray-400">({{ 'account.device.' + row.deviceType | translate }})</span></td>
              <td class="px-4 py-3 text-gray-600">{{ row.ipAddress ?? '-' }}</td>
              <td class="px-4 py-3 text-gray-600">
                @if (row.loggedOutAt) { {{ row.loggedOutAt | date: 'medium' }} <span class="text-xs text-gray-400">({{ 'account.reason.' + row.logoutReason | translate }})</span> } @else { - }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="py-10 text-center text-sm text-gray-400">{{ 'loginLogs.empty' | translate }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LoginLogTableComponent {
  readonly rows = input.required<LoginLogItem[]>();

  resultClass(result: LoginLogItem['result']): string {
    return loginResultBadgeClass(result);
  }
}
