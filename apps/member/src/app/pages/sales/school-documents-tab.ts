import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { InvoiceSummary, SchoolOrderStatus, SchoolOrderSummary } from '@org/shared-models';
import { ButtonComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';

type Row = { id: string; number: string; date: string; status: string; total: number; extra: string; school: string };
const PAGE_SIZE = 10;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The Orders tab and the Invoices tab of a school's profile (sales spec R15, platform U14), and, without a school, the lists of the
 * Orders menu (R19): the documents newest first with number, date, status and grand total, paged. Without a school the school is a
 * column and the list has a search and (for orders) a status filter. A row opens its document.
 */
@Component({
  selector: 'app-school-documents-tab',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, PaginationComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (schoolId() === null) {
        <div class="flex flex-wrap items-center gap-3">
          <input type="search" [formControl]="search" [placeholder]="(kind() === 'orders' ? 'sales.ordersPage.search' : 'sales.invoicesPage.search') | translate" [attr.aria-label]="'sales.ordersPage.search' | translate"
            class="h-10 min-w-[12rem] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
          @if (kind() === 'orders') {
            <select (change)="setStatus($any($event.target).value)" [attr.aria-label]="'sales.columns.status' | translate" [class]="select">
              <option value="">{{ 'sales.ordersPage.allStatuses' | translate }}</option>
              @for (s of statuses; track s) { <option [value]="s">{{ 'sales.status.' + s | translate }}</option> }
            </select>
          }
        </div>
      } @else if (kind() === 'orders') {
        <div class="flex justify-end"><app-button size="sm" (clicked)="newOrder()">{{ 'sales.orders.new' | translate }}</app-button></div>
      }
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      }
      <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
        <table class="w-full text-left text-xs">
          <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
            <tr>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.number' | translate }}</th>
              @if (schoolId() === null) { <th class="px-3 py-2 font-semibold">{{ 'sales.columns2.school' | translate }}</th> }
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.date' | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ (kind() === 'orders' ? 'sales.columns.session' : 'sales.columns.order') | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.status' | translate }}</th>
              <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.total' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
            @if (loading()) {
              <tr><td colspan="6" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr>
            } @else {
              @for (r of rows(); track r.id) {
                <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700" tabindex="0" (click)="open(r.id)" (keydown.enter)="open(r.id)">
                  <td class="whitespace-nowrap px-3 py-2 font-mono font-medium text-primary-fg">{{ r.number }}</td>
                  @if (schoolId() === null) { <td class="px-3 py-2 text-gray-700">{{ r.school }}</td> }
                  <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ r.date | date: 'dd MMM yy' }}</td>
                  <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ r.extra }}</td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusClass(r.status)">{{ 'sales.status.' + r.status | translate }}</span></td>
                  <td class="whitespace-nowrap px-3 py-2 text-right font-mono" [class.line-through]="r.status === 'CANCELLED'">{{ r.total | number: '1.2-2' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-6 text-center text-sm text-gray-400">{{ emptyKey() | translate }}</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [pageSize]="pageSize" [total]="total()" (pageChange)="goTo($event)" />
    </div>
  `,
})
export class SchoolDocumentsTabComponent {
  readonly kind = input.required<'orders' | 'invoices'>();
  /** The school whose documents are listed; `null` lists every school's (the Orders menu, R19). */
  readonly schoolId = input.required<string | null>();

  private readonly sales = inject(SalesService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly select = SELECT;
  readonly statuses: SchoolOrderStatus[] = ['DRAFT', 'CONFIRMED', 'CLOSED'];
  readonly pageSize = PAGE_SIZE;
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<SchoolOrderStatus | undefined>(undefined);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly rows = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.kind();
      this.schoolId();
      untracked(() => this.goTo(1));
    });
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.goTo(1));
  }

  emptyKey(): string {
    if (this.schoolId() === null) {
      return this.kind() === 'orders' ? 'sales.ordersPage.empty' : 'sales.invoicesPage.empty';
    }
    return this.kind() === 'orders' ? 'sales.orders.empty' : 'sales.invoices.empty';
  }

  setStatus(value: string): void {
    this.status.set((value || undefined) as SchoolOrderStatus | undefined);
    this.goTo(1);
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params = { schoolId: this.schoolId() ?? undefined, search: this.search.value.trim() || undefined, pageIndex: this.page(), pageSize: PAGE_SIZE };
    const done = (items: Row[], total: number) => {
      this.loading.set(false);
      this.rows.set(items);
      this.total.set(total);
    };
    const failed = (error: unknown) => {
      this.loading.set(false);
      this.error.set(messageForError(error, this.translate));
    };
    if (this.kind() === 'orders') {
      this.sales.orders({ ...params, status: this.status() }).subscribe({ next: (p) => done(p.items.map(orderRow), p.totalCount), error: failed });
    } else {
      this.sales.invoices(params).subscribe({ next: (p) => done(p.items.map(invoiceRow), p.totalCount), error: failed });
    }
  }

  open(id: string): void {
    void this.router.navigate([this.kind() === 'orders' ? '/school-orders' : '/invoices', id]);
  }

  newOrder(): void {
    void this.router.navigate(['/school-orders', 'new'], { queryParams: { schoolId: this.schoolId() } });
  }

  statusClass(status: string): string {
    return status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : status === 'CANCELLED' ? 'bg-red-50 text-red-700' : status === 'CLOSED' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700';
  }
}

function orderRow(o: SchoolOrderSummary): Row {
  return { id: o.id, number: o.number, date: o.orderDate, status: o.status, total: o.grandTotal, extra: o.session, school: `${o.schoolName} (${o.schoolCode})` };
}

function invoiceRow(i: InvoiceSummary): Row {
  return { id: i.id, number: i.number, date: i.invoiceDate, status: i.status, total: i.grandTotal, extra: i.orderNumber, school: `${i.schoolName} (${i.schoolCode})` };
}
