import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import { IamLoginLogService, IamUsersService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  COMPANY_ROLES,
  AccountStatus,
  AppRole,
  LoginLogItem,
  STAFF_ASSIGNABLE_ROLES,
  UserDetail,
  UserSessionItem,
  UserStatusHistoryItem,
} from '@org/shared-models';
import { accountStatusBadgeClass, avatarColorClass, initials } from '@org/shared-utils';
import { ButtonComponent, CardComponent, ModalComponent, SkeletonLoaderComponent, ToastService } from '@org/ui';
import { LoginLogTableComponent } from '../login-logs/login-log-table';

type StatusAction = 'approve' | 'activate' | 'deactivate' | 'suspend' | 'reject';
type PlainAction = 'unlock' | 'force-logout' | 'force-password-change' | 'reset-password' | 'release-identity';
type ActionKey = StatusAction | PlainAction | 'change-role';

/** The icon and colour an action button gets, purely cosmetic - the server decides what is actually allowed. */
const ACTION_ICON: Record<ActionKey, string> = {
  approve: 'M5 13l4 4L19 7',
  activate: 'M5 13l4 4L19 7',
  deactivate: 'M18.36 6.64a9 9 0 11-12.73 0M12 3v9',
  suspend: 'M10 9v6m4-6v6M5 3h14l-1 18H6L5 3z',
  reject: 'M6 18L18 6M6 6l12 12',
  'change-role': 'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4',
  unlock: 'M8 11V7a4 4 0 118 0M6 11h12v9H6v-9z',
  'force-logout': 'M17 16l4-4m0 0l-4-4m4 4H7m5-9H5a2 2 0 00-2 2v14a2 2 0 002 2h7',
  'force-password-change': 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z',
  'reset-password': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'release-identity': 'M17 8l4 4m0 0l-4 4m4-4H3',
};

/** What one action needs from the Super Admin before it is sent (spec R30: the reason is mandatory for these). */
interface ActionSpec {
  key: ActionKey;
  danger?: boolean;
  reason?: 'required' | 'optional';
  until?: boolean;
  role?: boolean;
}

/** The actions a status offers (spec R28 state diagram); the server enforces the same table, this only hides what cannot work. */
const STATUS_ACTIONS: Record<AccountStatus, ActionSpec[]> = {
  PENDING: [{ key: 'approve', reason: 'optional' }, { key: 'reject', danger: true, reason: 'required' }],
  ACTIVE: [{ key: 'suspend', danger: true, reason: 'required', until: true }, { key: 'deactivate', danger: true, reason: 'required' }],
  INACTIVE: [{ key: 'activate', reason: 'optional' }],
  SUSPENDED: [{ key: 'activate', reason: 'optional' }, { key: 'deactivate', danger: true, reason: 'required' }],
  REJECTED: [{ key: 'release-identity' }],
};

const CHANGE_ROLE: ActionSpec = { key: 'change-role', reason: 'required', role: true };
const UNLOCK: ActionSpec = { key: 'unlock' };
const FORCE_LOGOUT: ActionSpec = { key: 'force-logout', danger: true };
const FORCE_PASSWORD_CHANGE: ActionSpec = { key: 'force-password-change' };
const RESET_LINK: ActionSpec = { key: 'reset-password' };

const INPUT_CLASS =
  'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * Super Admin user detail (spec R33, R35, R39): the profile with an edit form, the current status with the actions that
 * status allows, the status timeline and the active sessions with a revoke button. Every action goes through one dialog
 * that asks only for what that action needs (a reason, an end date, a role) and shows the API's error as the catalogue
 * text of its code. Nothing here decides whether a change is legal; the server's answer is what the screen shows.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    SkeletonLoaderComponent,
    LoginLogTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <a routerLink="/users" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        {{ 'users.back' | translate }}
      </a>

      @if (loadError()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">{{ loadError() }}</p>
      }

      @if (!user() && !loadError()) {
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div class="flex items-center gap-4">
            <app-skeleton-loader type="circle" width="4rem" />
            <div class="space-y-2"><app-skeleton-loader width="12rem" height="1.25rem" /><app-skeleton-loader width="8rem" /></div>
          </div>
        </div>
      }

      @if (user(); as u) {
        <div class="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold" [class]="avatarClass(u.fullName)">{{ avatarInitials(u.fullName) }}</div>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-2xl font-bold text-primary-fg">{{ u.fullName }}</h1>
            <p class="text-sm text-gray-500">{{ '@' }}{{ u.userName }} &middot; {{ 'users.role.' + u.role | translate }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-sm font-medium" [class]="statusClass(u.status)">{{ 'users.status.' + u.status | translate }}</span>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ 'users.detail.lastLogin' | translate }}</p>
            <p class="mt-1 text-sm font-semibold text-primary-fg">{{ u.lastLoginAt ? (u.lastLoginAt | date: 'medium') : '-' }}</p>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ 'users.detail.lock' | translate }}</p>
            <p class="mt-1 flex items-center gap-1.5 text-sm font-semibold" [class.text-amber-600]="u.isLocked" [class.text-primary-fg]="!u.isLocked">
              @if (u.isLocked) { <span class="h-2 w-2 rounded-full bg-amber-500"></span> {{ u.lockedUntil | date: 'medium' }} }
              @else { {{ 'users.detail.notLocked' | translate }} }
            </p>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ 'users.detail.mustChange' | translate }}</p>
            <p class="mt-1 text-sm font-semibold text-primary-fg">{{ (u.mustChangePassword ? 'users.yes' : 'users.no') | translate }}</p>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ 'users.detail.changedAt' | translate }}</p>
            <p class="mt-1 text-sm font-semibold text-primary-fg">{{ u.statusChangedAt ? (u.statusChangedAt | date: 'medium') : '-' }}</p>
          </div>
        </div>
        @if (u.statusReason || u.suspendedUntil) {
          <p class="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
            <span class="font-semibold text-primary-fg">{{ 'users.detail.reason' | translate }}:</span> {{ u.statusReason || '-' }}
            @if (u.suspendedUntil) { <span class="ml-2 text-xs text-gray-500">({{ 'users.detail.suspendedUntil' | translate }} {{ u.suspendedUntil | date: 'medium' }})</span> }
          </p>
        }

        <app-card [title]="'users.detail.actions' | translate">
          <div class="flex flex-wrap gap-2">
            @for (spec of actions(); track spec.key) {
              <button
                type="button"
                (click)="begin(spec)"
                class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                [class]="spec.danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="actionIcon(spec.key)" /></svg>
                {{ 'users.action.' + spec.key | translate }}
              </button>
            }
          </div>
        </app-card>

        <app-card [title]="'users.detail.profile' | translate">
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid gap-4 sm:grid-cols-3">
            <div>
              <label for="p-fullName" class="mb-1 block text-sm font-semibold">{{ 'users.fields.fullName' | translate }}</label>
              <input id="p-fullName" formControlName="fullName" class="${INPUT_CLASS}" />
            </div>
            <div>
              <label for="p-email" class="mb-1 block text-sm font-semibold">{{ 'users.fields.email' | translate }}</label>
              <input id="p-email" type="email" formControlName="email" class="${INPUT_CLASS}" />
            </div>
            <div>
              <label for="p-mobile" class="mb-1 block text-sm font-semibold">{{ 'users.fields.mobile' | translate }}</label>
              <input id="p-mobile" formControlName="mobile" class="${INPUT_CLASS}" />
            </div>
            <div class="sm:col-span-3 flex items-center justify-between border-t border-gray-100 pt-4">
              <p class="text-sm text-red-600" role="alert">{{ profileError() }}</p>
              <app-button type="submit" [loading]="savingProfile()">{{ 'users.detail.save' | translate }}</app-button>
            </div>
          </form>
        </app-card>

        <app-card [title]="'users.detail.history' | translate" [padding]="false">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                <tr><th class="px-4 py-3 font-semibold">{{ 'users.history.when' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.history.change' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.history.reason' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.history.by' | translate }}</th></tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (row of history(); track row.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-600">{{ row.changedAt | date: 'medium' }}</td>
                    <td class="px-4 py-3">
                      <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="statusClass(row.fromStatus)">{{ 'users.status.' + row.fromStatus | translate }}</span>
                      <svg class="mx-1 inline h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                      <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="statusClass(row.toStatus)">{{ 'users.status.' + row.toStatus | translate }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ row.reason || '-' }}@if (row.until) { <span class="text-xs text-gray-400"> ({{ row.until | date: 'medium' }})</span> }</td>
                    <td class="px-4 py-3 text-gray-600">{{ row.changedByName ?? ('users.history.system' | translate) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="py-10 text-center text-sm text-gray-400">{{ 'users.history.empty' | translate }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>

        <app-card [title]="'users.detail.sessions' | translate" [padding]="false">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                <tr><th class="px-4 py-3 font-semibold">{{ 'users.sessions.started' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.sessions.lastSeen' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.sessions.ip' | translate }}</th><th class="px-4 py-3 font-semibold">{{ 'users.sessions.agent' | translate }}</th><th></th></tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (s of sessions(); track s.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-600">{{ s.createdAt | date: 'medium' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ s.lastSeenAt ? (s.lastSeenAt | date: 'medium') : '-' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ s.ipAddress ?? '-' }}</td>
                    <td class="max-w-xs truncate px-4 py-3 text-gray-600" [title]="s.userAgent ?? ''">{{ s.userAgent ?? '-' }}</td>
                    <td class="px-4 py-3 text-right"><app-button size="sm" variant="danger" (clicked)="revoke(s)">{{ 'users.sessions.revoke' | translate }}</app-button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="py-10 text-center text-sm text-gray-400">{{ 'users.sessions.empty' | translate }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>

        <app-card [title]="'users.detail.logins' | translate" [padding]="false">
          <app-login-log-table [rows]="logins()" />
        </app-card>
      }
    </div>

    <app-modal [open]="pending() !== null" [title]="pending() ? ('users.action.' + pending()!.key | translate) : ''" (closed)="cancel()">
      @if (pending(); as spec) {
        <form [formGroup]="actionForm" (ngSubmit)="confirm()" class="space-y-4">
          <p class="text-sm text-gray-600">{{ 'users.confirm.' + spec.key | translate }}</p>
          @if (spec.role) {
            <div>
              <label for="a-role" class="mb-1 block text-sm font-semibold">{{ 'users.fields.role' | translate }}</label>
              <select id="a-role" formControlName="role" class="${INPUT_CLASS}">
                @for (r of roleChoices(); track r) { <option [value]="r">{{ 'users.role.' + r | translate }}</option> }
              </select>
            </div>
          }
          @if (spec.reason) {
            <div>
              <label for="a-reason" class="mb-1 block text-sm font-semibold">{{ 'users.fields.reason' | translate }}@if (spec.reason === 'optional') { <span class="font-normal text-gray-400"> ({{ 'users.optional' | translate }})</span> }</label>
              <textarea id="a-reason" formControlName="reason" rows="3" class="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"></textarea>
            </div>
          }
          @if (spec.until) {
            <div>
              <label for="a-until" class="mb-1 block text-sm font-semibold">{{ 'users.fields.until' | translate }} <span class="font-normal text-gray-400">({{ 'users.optional' | translate }})</span></label>
              <input id="a-until" type="datetime-local" formControlName="until" class="${INPUT_CLASS}" />
            </div>
          }
          @if (actionError()) {
            <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ actionError() }}</p>
          }
          <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <app-button variant="secondary" (clicked)="cancel()">{{ 'users.cancel' | translate }}</app-button>
            <app-button type="submit" [variant]="spec.danger ? 'danger' : 'primary'" [loading]="working()">{{ 'users.confirm.submit' | translate }}</app-button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class UserDetailComponent {
  private readonly users = inject(IamUsersService);
  private readonly loginLogs = inject(IamLoginLogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly user = signal<UserDetail | null>(null);
  readonly history = signal<UserStatusHistoryItem[]>([]);
  readonly sessions = signal<UserSessionItem[]>([]);
  readonly logins = signal<LoginLogItem[]>([]);
  readonly loadError = signal('');

  readonly pending = signal<ActionSpec | null>(null);
  readonly working = signal(false);
  readonly actionError = signal('');
  readonly savingProfile = signal(false);
  readonly profileError = signal('');

  readonly profileForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true }),
  });

  readonly actionForm = new FormGroup({
    reason: new FormControl('', { nonNullable: true }),
    until: new FormControl('', { nonNullable: true }),
    role: new FormControl<AppRole>('SALES_CRM', { nonNullable: true }),
  });

  /** The actions of this user's status, plus the ones every live account has (spec R6, R34, R36). */
  readonly actions = computed<ActionSpec[]>(() => {
    const user = this.user();
    if (!user) return [];

    const list = [...STATUS_ACTIONS[user.status]];
    if (user.role !== 'MEMBER' && !COMPANY_ROLES.includes(user.role) && user.status !== 'REJECTED') list.push(CHANGE_ROLE);
    if (user.isLocked) list.push(UNLOCK);
    if (user.status === 'ACTIVE') list.push(FORCE_LOGOUT, FORCE_PASSWORD_CHANGE, RESET_LINK);
    return list;
  });

  readonly roleChoices = computed<readonly AppRole[]>(() =>
    STAFF_ASSIGNABLE_ROLES.filter((role) => role !== this.user()?.role),
  );

  constructor() {
    this.reload();
  }

  avatarInitials(fullName: string): string {
    return initials(fullName);
  }

  avatarClass(fullName: string): string {
    return avatarColorClass(fullName);
  }

  statusClass(status: AccountStatus): string {
    return accountStatusBadgeClass(status);
  }

  actionIcon(key: ActionKey): string {
    return ACTION_ICON[key];
  }

  begin(spec: ActionSpec): void {
    this.actionError.set('');
    this.actionForm.reset({ reason: '', until: '', role: this.roleChoices()[0] ?? 'SALES_CRM' });
    this.pending.set(spec);
  }

  cancel(): void {
    this.pending.set(null);
  }

  confirm(): void {
    const spec = this.pending();
    if (!spec || this.working()) return;

    this.working.set(true);
    this.actionError.set('');
    this.request(spec).subscribe({
      next: () => {
        this.working.set(false);
        this.pending.set(null);
        this.toast.show(this.translate.instant(`users.done.${spec.key}`), 'success');
        this.reload();
      },
      error: (error: unknown) => {
        this.working.set(false);
        this.actionError.set(messageForError(error, this.translate));
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) return;

    const { fullName, email, mobile } = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.profileError.set('');
    this.users.update(this.id, { fullName: fullName.trim(), email: email.trim() || undefined, mobile: mobile.trim() || undefined }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.toast.show(this.translate.instant('users.done.profile'), 'success');
        this.reload();
      },
      error: (error: unknown) => {
        this.savingProfile.set(false);
        this.profileError.set(messageForError(error, this.translate));
      },
    });
  }

  revoke(session: UserSessionItem): void {
    this.users.revokeSession(this.id, session.id).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('users.done.revoke'), 'success');
        this.reload();
      },
    });
  }

  private request(spec: ActionSpec): Observable<void> {
    const { reason, until, role } = this.actionForm.getRawValue();
    const text = reason.trim() || undefined;

    switch (spec.key) {
      case 'change-role':
        return this.users.changeRole(this.id, { role, reason: reason.trim() });
      case 'approve':
      case 'activate':
      case 'deactivate':
      case 'suspend':
      case 'reject':
        return this.users.changeStatus(this.id, spec.key, { reason: text, suspendedUntil: until ? new Date(until).toISOString() : undefined });
      default:
        return this.users.perform(this.id, spec.key);
    }
  }

  private reload(): void {
    this.loadError.set('');
    forkJoin({
      user: this.users.get(this.id),
      history: this.users.statusHistory(this.id),
      sessions: this.users.sessions(this.id),
      logins: this.loginLogs.search({ userId: this.id, pageIndex: 1, pageSize: 10 }),
    }).subscribe({
      next: ({ user, history, sessions, logins }) => {
        this.logins.set(logins.items);
        this.user.set(user);
        this.history.set(history);
        this.sessions.set(sessions);
        this.profileForm.reset({ fullName: user.fullName, email: user.email ?? '', mobile: user.mobile ?? '' });
      },
      error: (error: unknown) => {
        this.loadError.set(messageForError(error, this.translate));
        void this.router.navigate(['/users']);
      },
    });
  }
}
