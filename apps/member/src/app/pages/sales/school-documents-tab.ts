import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { InvoiceSummary, SchoolOrderSummary } from '@org/shared-models';
import { ButtonComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';

type Row = { id: string; number: string; date: string; status: string; total: number; extra: string };
const PAGE_SIZE = 10;

/**
 * The Orders tab and the Invoices tab of a school's profile (sales spec R15, platform U14): the school's documents newest first
 * with number, date, status and grand total, paged; "New order" opens the full-width order editor; a row opens its document.
 */
@Component({
  selector: 'app-school-documents-tab',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, ButtonComponent, PaginationComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (kind() === 'orders') {
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
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.date' | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ (kind() === 'orders' ? 'sales.columns.session' : 'sales.columns.order') | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.status' | translate }}</th>
              <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.total' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
            @if (loading()) {
              <tr><td colspan="5" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr>
            } @else {
              @for (r of rows(); track r.id) {
                <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700" tabindex="0" (click)="open(r.id)" (keydown.enter)="open(r.id)">
                  <td class="whitespace-nowrap px-3 py-2 font-mono font-medium text-primary-fg">{{ r.number }}</td>
                  <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ r.date | date: 'dd MMM yy' }}</td>
                  <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ r.extra }}</td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusClass(r.status)">{{ 'sales.status.' + r.status | translate }}</span></td>
                  <td class="whitespace-nowrap px-3 py-2 text-right font-mono" [class.line-through]="r.status === 'CANCELLED'">{{ r.total | number: '1.2-2' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-6 text-center text-sm text-gray-400">{{ (kind() === 'orders' ? 'sales.orders.empty' : 'sales.invoices.empty') | translate }}</td></tr>
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
  readonly schoolId = input.required<string>();

  private readonly sales = inject(SalesService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly pageSize = PAGE_SIZE;
  readonly page = signal(1);
  readonly total = signal(0);
  readonly rows = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.kind();
      this.schoolId();
      untracked(() => {
        this.page.set(1);
        this.load();
      });
    });
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params = { schoolId: this.schoolId(), pageIndex: this.page(), pageSize: PAGE_SIZE };
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
      this.sales.orders(params).subscribe({ next: (p) => done(p.items.map(orderRow), p.totalCount), error: failed });
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
  return { id: o.id, number: o.number, date: o.orderDate, status: o.status, total: o.grandTotal, extra: o.session };
}

function invoiceRow(i: InvoiceSummary): Row {
  return { id: i.id, number: i.number, date: i.invoiceDate, status: i.status, total: i.grandTotal, extra: i.orderNumber };
}
