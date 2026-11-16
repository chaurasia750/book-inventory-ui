import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PurchaseService, VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { PagedList, RETURN_STATUSES, ReturnStatus, VendorReturnMade, VendorReturnSummary, VendorSummary } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { VendorReturnAddComponent } from './vendor-return-add';
import { VendorReturnDetailComponent } from './vendor-return-detail';

const PAGE_SIZE = 20;
const VENDOR_CHOICES = 200;
const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The company's vendor returns (purchase spec R2-R12): search by number and vendor, filters by vendor, status and date range, paging,
 * newest first. A vendor return and the form for a new one open in the panel beside the list (platform U10). The Owner and Staff reach
 * it (the route is guarded); the Owner cancels inside the panel (R9).
 */
@Component({
  selector: 'app-vendor-return-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, VendorReturnAddComponent, VendorReturnDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-primary-fg">{{ 'purchase.title' | translate }}</h1>
          <p class="mt-0.5 text-sm text-gray-500">{{ 'purchase.subtitle' | translate }}</p>
        </div>
        <app-button (clicked)="openNew()">{{ 'purchase.new' | translate }}</app-button>
      </div>

      <app-list-detail [hasDetail]="hasPanel()" [listLabel]="'purchase.title' | translate" [detailLabel]="'purchase.panelLabel' | translate">
        <div list>
          @if (!hasPanel()) {
            <div class="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4 dark:border-charcoal-700">
              <input type="search" [formControl]="search" [placeholder]="'purchase.search' | translate" [attr.aria-label]="'purchase.search' | translate" class="min-w-[9rem] flex-1 ${FIELD}" />
              <div class="w-52"><select (change)="setVendor($any($event.target).value)" [attr.aria-label]="'purchase.fields.vendor' | translate" class="${FIELD}">
                <option value="">{{ 'purchase.allVendors' | translate }}</option>
                @for (v of vendors(); track v.id) { <option [value]="v.id">{{ v.name }}</option> }
              </select></div>
              <div class="w-36"><select (change)="setStatus($any($event.target).value)" [attr.aria-label]="'returns.columns.status' | translate" class="${FIELD}">
                <option value="">{{ 'returns.allStatuses' | translate }}</option>
                @for (s of statuses; track s) { <option [value]="s">{{ 'returns.status.' + s | translate }}</option> }
              </select></div>
              <div class="w-32"><app-date-picker [formControl]="from" [placeholder]="'counter.bills.from' | translate" inputId="vrl-from" /></div>
              <div class="w-32"><app-date-picker [formControl]="to" [placeholder]="'counter.bills.to' | translate" inputId="vrl-to" /></div>
            </div>
          }

          @if (loadError()) {
            <div class="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
              <span>{{ loadError() }}</span><app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
            </div>
          }

          @if (hasPanel()) {
            <ul class="m-0 list-none divide-y divide-neutral-100 p-0 dark:divide-charcoal-700">
              @if (loading() && !result()) {
                @for (i of skeletonRows; track i) { <li class="px-4 py-3"><app-skeleton-loader width="100%" /></li> }
              } @else {
                @for (r of result()?.items ?? []; track r.id) {
                  <li [class.bg-gold-50]="r.id === selectedId()">
                    <button type="button" (click)="openView(r.id)" class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-charcoal-700" [attr.aria-current]="r.id === selectedId() ? 'true' : null">
                      <span class="min-w-0 flex-1"><span class="block whitespace-nowrap font-mono text-xs font-medium text-primary-fg">{{ r.number }}</span><span class="block truncate text-xs text-gray-500">{{ r.vendorName }}</span></span>
                      <span class="shrink-0 text-right"><span class="block font-mono text-sm" [class.line-through]="r.status === 'CANCELLED'">{{ r.grandTotal | number: '1.2-2' }}</span><span class="block text-[11px] text-gray-500">{{ r.returnDate | date: 'dd MMM yy' }}</span></span>
                    </button>
                  </li>
                } @empty { @if (!loadError()) { <li class="py-8 text-center text-sm text-gray-400">{{ 'purchase.empty' | translate }}</li> } }
              }
            </ul>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.number' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'purchase.fields.vendor' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.date' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.status' | translate }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ 'sales.totals.grandTotal' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (loading() && !result()) {
                    @for (i of skeletonRows; track i) { <tr><td colspan="5" class="px-4 py-3"><app-skeleton-loader width="100%" /></td></tr> }
                  } @else {
                    @for (r of result()?.items ?? []; track r.id) {
                      <tr class="cursor-pointer transition-colors hover:bg-brand-50/60" (click)="openView(r.id)" (keydown.enter)="openView(r.id)" tabindex="0">
                        <td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-primary-fg">{{ r.number }}</td>
                        <td class="px-4 py-3 text-gray-700"><div>{{ r.vendorName }}</div><div class="font-mono text-xs text-gray-500">{{ r.vendorCode }}</div></td>
                        <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ r.returnDate | date: 'dd MMM yy' }}</td>
                        <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="statusClass(r.status)">{{ 'returns.status.' + r.status | translate }}</span></td>
                        <td class="whitespace-nowrap px-4 py-3 text-right font-mono" [class.line-through]="r.status === 'CANCELLED'">{{ r.grandTotal | number: '1.2-2' }}</td>
                      </tr>
                    } @empty { @if (!loadError()) { <tr><td colspan="5" class="py-10 text-center text-sm text-gray-400">{{ 'purchase.empty' | translate }}</td></tr> } }
                  }
                </tbody>
              </table>
            </div>
          }
          <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goToPage($event)" />
        </div>

        <div detail>
          @switch (panel().mode) {
            @case ('new') { <app-vendor-return-add (created)="openCreated($event)" (closed)="closePanel()" /> }
            @default {
              @if (selectedId(); as id) { <app-vendor-return-detail [id]="id" (closed)="closePanel()" (changed)="load()" /> }
            }
          }
        </div>
      </app-list-detail>
    </div>
  `,
})
export class VendorReturnListComponent {
  private readonly purchase = inject(PurchaseService);
  private readonly vendorsApi = inject(VendorService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly statuses = RETURN_STATUSES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly from = new FormControl('', { nonNullable: true });
  readonly to = new FormControl('', { nonNullable: true });
  readonly status = signal<ReturnStatus | ''>('');
  readonly vendorId = signal('');
  readonly vendors = signal<VendorSummary[]>([]);

  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;
  readonly result = signal<PagedList<VendorReturnSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  statusClass = counterBillStatusBadgeClass;

  constructor() {
    for (const control of [this.search, this.from, this.to]) {
      control.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyFilters());
    }
    this.vendorsApi.list({ orderBy: 'Name ASC', pageIndex: 1, pageSize: VENDOR_CHOICES }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (p) => this.vendors.set(p.items), error: () => this.vendors.set([]) });
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setVendor(id: string): void {
    this.vendorId.set(id);
    this.applyFilters();
  }

  setStatus(value: string): void {
    this.status.set(value as ReturnStatus | '');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openNew(): void {
    void this.router.navigate(['/vendor-returns', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/vendor-returns', id]);
  }

  closePanel(): void {
    void this.router.navigate(['/vendor-returns']);
  }

  /** R6: a vendor return that took an item to zero stock or below opens with its notice (the navigation state carries it). */
  openCreated(made: VendorReturnMade): void {
    this.load();
    void this.router.navigate(['/vendor-returns', made.vendorReturnId], { state: { lowStockId: made.itemsAtOrBelowZero.length > 0 ? made.vendorReturnId : null } });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.purchase
      .vendorReturns({
        search: this.search.value.trim() || undefined,
        vendorId: this.vendorId() || undefined,
        status: this.status() || undefined,
        from: this.from.value || undefined,
        to: this.to.value || undefined,
        orderBy: 'CreatedAt DESC',
        pageIndex: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          this.result.set(result);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(messageForError(error, this.translate));
        },
      });
  }
}
