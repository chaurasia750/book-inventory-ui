import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamSelfService } from '@org/api-services';
import { AuthService } from '@org/auth';
import { OwnSession } from '@org/shared-models';
import { deviceIconPath } from '@org/shared-utils';
import { ToastService } from '@org/ui';

/**
 * "My sessions" (spec R15): the devices the caller is signed in on, with the browser, operating system, address and last
 * activity, the current one marked. Any other device can be signed out on its own (its next request is a 401), and "sign out
 * everywhere" ends every session including this one and returns to the login page.
 */
@Component({
  selector: 'lib-sessions-screen',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-4xl">
      <div class="rounded-2xl border border-default bg-surface p-5 shadow-xl sm:p-8">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-bold text-primary-fg">{{ 'account.sessions.title' | translate }}</h2>
            <p class="mt-0.5 text-sm text-gray-500">{{ sessions().length }} {{ 'account.sessions.subtitle' | translate }}</p>
          </div>
          <button type="button" (click)="signOutEverywhere()"
            class="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m5-9H5a2 2 0 00-2 2v14a2 2 0 002 2h7" /></svg>
            {{ 'account.sessions.everywhere' | translate }}
          </button>
        </div>
        <ul class="space-y-3">
          @for (s of sessions(); track s.id) {
            <li class="flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors"
              [class]="s.isCurrent ? 'border-brand-500/40 bg-brand-500/5' : 'border-default'">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" [class]="s.isCurrent ? 'bg-brand-500/15 text-brand-600' : 'bg-gray-500/10 text-gray-500'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="deviceIcon(s.deviceType)" /></svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-2 font-semibold text-primary-fg">
                  {{ s.browserName ?? ('account.unknown' | translate) }} &middot; {{ s.osName ?? ('account.unknown' | translate) }}
                  @if (s.deviceType) { <span class="text-xs font-normal text-gray-500">({{ 'account.device.' + s.deviceType | translate }})</span> }
                  @if (s.isCurrent) { <span class="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-600">{{ 'account.sessions.current' | translate }}</span> }
                </p>
                <p class="mt-0.5 text-xs text-gray-500">
                  {{ s.ipAddress ?? '-' }} &middot; {{ 'account.sessions.started' | translate }} {{ s.createdAt | date: 'medium' }} &middot;
                  {{ 'account.sessions.lastSeen' | translate }} {{ s.lastSeenAt ? (s.lastSeenAt | date: 'medium') : '-' }}
                </p>
              </div>
              @if (!s.isCurrent) {
                <button type="button" (click)="revoke(s)" class="shrink-0 rounded-xl border border-default px-3 py-1.5 text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-500">{{ 'account.sessions.signOut' | translate }}</button>
              }
            </li>
          } @empty {
            <li class="py-6 text-center text-sm text-gray-400">{{ 'account.sessions.empty' | translate }}</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class SessionsScreenComponent {
  private readonly self = inject(IamSelfService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly sessions = signal<OwnSession[]>([]);

  constructor() {
    this.load();
  }

  deviceIcon(deviceType: OwnSession['deviceType']): string {
    return deviceIconPath(deviceType);
  }

  revoke(session: OwnSession): void {
    this.self.revokeSession(session.id).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('account.sessions.revoked'), 'success');
        this.load();
      },
    });
  }

  signOutEverywhere(): void {
    this.self.logoutAll().subscribe({ next: () => this.auth.logout().subscribe() });
  }

  private load(): void {
    this.self.sessions().subscribe((sessions) => this.sessions.set(sessions));
  }
}
