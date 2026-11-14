import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CompanyService, CoreAuditService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AuditEntry, CompanySummary, PagedList } from '@org/shared-models';
import { ButtonComponent, CardComponent, PaginationComponent } from '@org/ui';

const PAGE_SIZE = 20;
const FIELD_CLASS = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/** One field of the old/new comparison; `changed` marks a value that differs between the two. */
interface ValueRow {
  key: string;
  oldValue: string;
  newValue: string;
  changed: boolean;
}

/**
 * The audit log (core A7-A9) for the Super Admin and for the Owner: newest first and paged, filtered by entity type, entity
 * id, user and date range; opening a row shows the old and the new value side by side. The Super Admin also filters by
 * company and sees the company of each row; an Owner sees only their own company, which the server decides, so no company
 * filter is offered to them. A job and the hidden system account both show under one fixed label and never with an id
 * (core A4). Other roles cannot open the page: the routes are guarded and the API answers 403 anyway.
 */
@Component({
  selector: 'app-audit-log-screen',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-fg">{{ 'auditLog.title' | translate }}</h1>
        <p class="mt-0.5 text-sm text-gray-500">{{ 'auditLog.subtitle' | translate }}</p>
      </div>

      <app-card [padding]="false">
        <form [formGroup]="filters" (ngSubmit)="apply()" class="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          @if (isSuperAdmin) {
            <select formControlName="companyId" [attr.aria-label]="'auditLog.company' | translate" class="${FIELD_CLASS}">
              <option value="">{{ 'auditLog.anyCompany' | translate }}</option>
              @for (c of companies(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          }
          <select formControlName="entityType" class="${FIELD_CLASS}">
            <option value="">{{ 'auditLog.anyType' | translate }}</option>
            @for (type of entityTypes(); track type) { <option [value]="type">{{ type }}</option> }
          </select>
          <input formControlName="entityId" [placeholder]="'auditLog.entityId' | translate" class="${FIELD_CLASS} w-72" />
          <input formControlName="userId" [placeholder]="'auditLog.userId' | translate" class="${FIELD_CLASS} w-72" />
          <input type="date" formControlName="from" [attr.aria-label]="'auditLog.from' | translate" class="${FIELD_CLASS}" />
          <input type="date" formControlName="to" [attr.aria-label]="'auditLog.to' | translate" class="${FIELD_CLASS}" />
          <app-button type="submit" size="sm" class="ml-auto">{{ 'auditLog.search' | translate }}</app-button>
        </form>

        @if (error()) {
          <div class="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
            <span>{{ error() }}</span>
            <app-button variant="secondary" size="sm" (clicked)="load()">{{ 'auditLog.retry' | translate }}</app-button>
          </div>
        }

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'auditLog.time' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'auditLog.user' | translate }}</th>
                @if (isSuperAdmin) {
                  <th class="px-4 py-3 font-semibold">{{ 'auditLog.company' | translate }}</th>
                }
                <th class="px-4 py-3 font-semibold">{{ 'auditLog.entityType' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'auditLog.entityIdColumn' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'auditLog.action' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @if (loading()) {
                @for (n of skeleton; track n) {
                  <tr aria-hidden="true"><td [attr.colspan]="columnCount" class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-gray-100"></div></td></tr>
                }
              } @else {
                @for (row of result()?.items ?? []; track row.id) {
                  <tr class="cursor-pointer transition-colors hover:bg-gray-50/60" [class.bg-brand-50]="selected()?.id === row.id" (click)="open(row)">
                    <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ row.createdAt | date: 'medium' }}</td>
                    <td class="px-4 py-3">
                      @if (row.actor.isSystem) {
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium italic text-gray-500">{{ 'auditLog.system' | translate }}</span>
                      } @else {
                        <span class="font-medium text-primary-fg">{{ row.actor.name ?? '-' }}</span>
                      }
                    </td>
                    @if (isSuperAdmin) {
                      <td class="px-4 py-3 text-gray-600">{{ companyName(row.companyId) }}</td>
                    }
                    <td class="px-4 py-3 text-gray-600">{{ row.entityType }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ row.entityId }}</td>
                    <td class="px-4 py-3 font-medium text-primary-fg">{{ row.action }}</td>
                  </tr>
                } @empty {
                  @if (!error()) {
                    <tr><td [attr.colspan]="columnCount" class="py-10 text-center text-sm text-gray-400">{{ 'auditLog.empty' | translate }}</td></tr>
                  }
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goTo($event)" />
      </app-card>

      @if (selected(); as entry) {
        <app-card [title]="entry.action" [subtitle]="entry.entityType + ' ' + entry.entityId">
          <div class="mb-3 flex justify-end">
            <app-button variant="secondary" size="sm" (clicked)="selected.set(null)">{{ 'auditLog.close' | translate }}</app-button>
          </div>
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'auditLog.field' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'auditLog.oldValue' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'auditLog.newValue' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (v of comparison(entry); track v.key) {
                <tr [class.bg-amber-50]="v.changed">
                  <td class="px-3 py-2 font-medium text-primary-fg">{{ v.key }}@if (v.changed) { <span class="ml-2 text-xs font-normal text-amber-700">{{ 'auditLog.changed' | translate }}</span> }</td>
                  <td class="px-3 py-2 font-mono text-xs text-gray-600">{{ v.oldValue }}</td>
                  <td class="px-3 py-2 font-mono text-xs text-gray-600">{{ v.newValue }}</td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="py-6 text-center text-sm text-gray-400">{{ 'auditLog.noValues' | translate }}</td></tr>
              }
            </tbody>
          </table>
          <details class="mt-4 text-sm">
            <summary class="cursor-pointer text-gray-600">{{ 'auditLog.rawJson' | translate }}</summary>
            <pre class="mt-2 overflow-x-auto rounded-xl bg-gray-50 p-3 text-xs">{{ entry.oldValue ?? '-' }}</pre>
            <pre class="mt-2 overflow-x-auto rounded-xl bg-gray-50 p-3 text-xs">{{ entry.newValue ?? '-' }}</pre>
          </details>
        </app-card>
      }
    </div>
  `,
})
export class AuditLogScreenComponent {
  private readonly audit = inject(CoreAuditService);
  private readonly companyService = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly pageSize = PAGE_SIZE;
  readonly skeleton = [1, 2, 3, 4, 5];

  /** Only the Super Admin can filter by company; for an Owner the server applies their own company. */
  readonly isSuperAdmin = inject(AuthService).hasAppRole('SUPER_ADMIN');
  readonly columnCount = this.isSuperAdmin ? 6 : 5;

  readonly filters = new FormGroup({
    companyId: new FormControl('', { nonNullable: true }),
    entityType: new FormControl('', { nonNullable: true }),
    entityId: new FormControl('', { nonNullable: true }),
    userId: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly page = signal(1);
  readonly loading = signal(true);
  readonly result = signal<PagedList<AuditEntry> | null>(null);
  readonly entityTypes = signal<string[]>([]);
  readonly companies = signal<CompanySummary[]>([]);
  readonly error = signal('');
  readonly selected = signal<AuditEntry | null>(null);

  constructor() {
    this.audit.entityTypes().subscribe({ next: (types) => this.entityTypes.set(types), error: () => this.entityTypes.set([]) });
    if (this.isSuperAdmin) {
      this.companyService.list({ orderBy: 'Name ASC', pageIndex: 1, pageSize: 200 }).subscribe({
        next: (result) => this.companies.set(result.items),
        error: () => this.companies.set([]),
      });
    }
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

  open(entry: AuditEntry): void {
    this.selected.set(entry);
  }

  load(): void {
    const value = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.audit
      .search({
        companyId: this.isSuperAdmin ? value.companyId || undefined : undefined,
        entityType: value.entityType || undefined,
        entityId: value.entityId.trim() || undefined,
        userId: value.userId.trim() || undefined,
        from: value.from ? new Date(`${value.from}T00:00:00`).toISOString() : undefined,
        to: value.to ? new Date(`${value.to}T23:59:59`).toISOString() : undefined,
        pageIndex: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(messageForError(error, this.translate));
          this.loading.set(false);
        },
      });
  }

  /** The name of a company, for the Super Admin's list; a row without a company is a platform row. */
  companyName(id: string | null): string {
    if (!id) return '-';
    return this.companies().find((c) => c.id === id)?.name ?? id;
  }

  /** The old and the new value side by side, one row per field, a differing field marked as changed. */
  comparison(entry: AuditEntry): ValueRow[] {
    const before = parse(entry.oldValue);
    const after = parse(entry.newValue);
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    return keys.map((key) => {
      const oldValue = show(before[key]);
      const newValue = show(after[key]);
      return { key, oldValue, newValue, changed: oldValue !== newValue };
    });
  }
}

function parse(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const value: unknown = JSON.parse(json);
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : { value };
  } catch {
    return { value: json };
  }
}

function show(value: unknown): string {
  if (value === undefined) return '-';
  return typeof value === 'string' ? value : JSON.stringify(value);
}
