import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamLoginLogService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AppRole, LOGIN_RESULTS, LoginLogItem, LoginLogSearchParams, LoginResult, PagedList } from '@org/shared-models';
import { ButtonComponent, CardComponent, PaginationComponent } from '@org/ui';
import { LoginLogTableComponent } from './login-log-table';

const PAGE_SIZE = 20;
const SELECT_CLASS = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The Super Admin's login log (spec R26): the whole log with filters for user, role, result, address and date range, newest
 * first, paged, and a CSV export of the same filters. The server refuses an export that would be too large; that answer
 * arrives as a file (the request asks for one), so its code is read out of the body and shown as the catalogue text.
 */
@Component({
  selector: 'app-login-logs',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, PaginationComponent, LoginLogTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-primary-fg">{{ 'loginLogs.title' | translate }}</h1>
          <p class="mt-0.5 text-sm text-gray-500">{{ 'loginLogs.subtitle' | translate }}</p>
        </div>
        <app-button variant="secondary" [loading]="exporting()" (clicked)="export()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          {{ 'loginLogs.export' | translate }}
        </app-button>
      </div>

      <app-card [padding]="false">
        <form [formGroup]="filters" (ngSubmit)="apply()" class="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <select formControlName="role" class="${SELECT_CLASS}">
            <option value="">{{ 'users.filters.allRoles' | translate }}</option>
            @for (r of roles; track r) { <option [value]="r">{{ 'account.role.' + r | translate }}</option> }
          </select>
          <select formControlName="result" class="${SELECT_CLASS}">
            <option value="">{{ 'loginLogs.anyResult' | translate }}</option>
            @for (r of results; track r) { <option [value]="r">{{ 'account.result.' + r | translate }}</option> }
          </select>
          <input formControlName="ipAddress" [placeholder]="'loginLogs.ip' | translate" class="${SELECT_CLASS} w-36" />
          <input formControlName="userId" [placeholder]="'loginLogs.userId' | translate" class="${SELECT_CLASS} w-40" />
          <input type="date" formControlName="from" [attr.aria-label]="'loginLogs.from' | translate" class="${SELECT_CLASS}" />
          <input type="date" formControlName="to" [attr.aria-label]="'loginLogs.to' | translate" class="${SELECT_CLASS}" />
          <app-button type="submit" size="sm" class="ml-auto">{{ 'loginLogs.search' | translate }}</app-button>
        </form>

        @if (error()) {
          <p class="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">{{ error() }}</p>
        }

        <app-login-log-table [rows]="result()?.items ?? []" />
        <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goTo($event)" />
      </app-card>
    </div>
  `,
})
export class LoginLogsComponent {
  private readonly logs = inject(IamLoginLogService);
  private readonly translate = inject(TranslateService);

  readonly roles: readonly AppRole[] = ['SUPER_ADMIN', 'SALES_CRM', 'ACCOUNTS', 'MEMBER', 'OWNER', 'STAFF'];
  readonly results = LOGIN_RESULTS;
  readonly pageSize = PAGE_SIZE;

  readonly filters = new FormGroup({
    role: new FormControl<AppRole | ''>('', { nonNullable: true }),
    result: new FormControl<LoginResult | ''>('', { nonNullable: true }),
    ipAddress: new FormControl('', { nonNullable: true }),
    userId: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly page = signal(1);
  readonly result = signal<PagedList<LoginLogItem> | null>(null);
  readonly error = signal('');
  readonly exporting = signal(false);

  constructor() {
    this.load();
  }

  apply(): void {
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  export(): void {
    this.exporting.set(true);
    this.error.set('');
    this.logs.export(this.params()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `login-log-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (response: { error?: Blob }) => {
        this.exporting.set(false);
        void this.showExportError(response.error);
      },
    });
  }

  private async showExportError(body: Blob | undefined): Promise<void> {
    let code = '';
    try {
      code = (JSON.parse((await body?.text()) ?? '{}') as { code?: string }).code ?? '';
    } catch {
      code = '';
    }

    const key = `errors.${code}`;
    const text = code ? this.translate.instant(key) : '';
    this.error.set(text && text !== key ? text : this.translate.instant('errors.generic'));
  }

  private params(): Omit<LoginLogSearchParams, 'pageIndex' | 'pageSize'> {
    const value = this.filters.getRawValue();
    return {
      role: value.role || undefined,
      result: value.result || undefined,
      ipAddress: value.ipAddress.trim() || undefined,
      userId: value.userId.trim() || undefined,
      from: value.from ? new Date(`${value.from}T00:00:00`).toISOString() : undefined,
      to: value.to ? new Date(`${value.to}T23:59:59`).toISOString() : undefined,
    };
  }

  private load(): void {
    this.error.set('');
    this.logs.search({ ...this.params(), pageIndex: this.page(), pageSize: PAGE_SIZE }).subscribe({
      next: (result) => this.result.set(result),
      error: (error: unknown) => this.error.set(messageForError(error, this.translate)),
    });
  }
}
