import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ReturnService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CREDIT_NOTE_REASONS, CreditNoteMade, CreditNoteReason, CreditNoteSummary, PagedList, RETURN_STATUSES, ReturnStatus } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SchoolSelectComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { CreditNoteAddComponent } from './credit-note-add';
import { CreditNoteDetailComponent } from './credit-note-detail';

const PAGE_SIZE = 20;
const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The company's credit notes, the school returns (sales spec R53-R61): search by number and school, filters by school, status, reason
 * and date range, paging, newest first. A credit note and the form for a new one open in the panel beside the list (platform U10).
 * The Owner and Staff reach it (the route is guarded); the Owner cancels inside the panel (R60).
 */
@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SchoolSelectComponent, SkeletonLoaderComponent, CreditNoteAddComponent, CreditNoteDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-primary-fg">{{ 'returns.title' | translate }}</h1>
          <p class="mt-0.5 text-sm text-gray-500">{{ 'returns.subtitle' | translate }}</p>
        </div>
        <app-button (clicked)="openNew()">{{ 'returns.new' | translate }}</app-button>
      </div>

      <app-list-detail [hasDetail]="hasPanel()" [listLabel]="'returns.title' | translate" [detailLabel]="'returns.panelLabel' | translate">
        <div list>
          @if (!hasPanel()) {
            <div class="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4 dark:border-charcoal-700">
              <input type="search" [formControl]="search" [placeholder]="'returns.search' | translate" [attr.aria-label]="'returns.search' | translate" class="min-w-[9rem] flex-1 ${FIELD}" />
              <div class="w-48"><app-school-select [allLabel]="'returns.allSchools' | translate" [placeholder]="'returns.allSchools' | translate" [activeOnly]="false" (picked)="setSchool($event?.id ?? '')" /></div>
              <div class="w-36"><select (change)="setStatus($any($event.target).value)" [attr.aria-label]="'returns.columns.status' | translate" class="${FIELD}">
                <option value="">{{ 'returns.allStatuses' | translate }}</option>
                @for (s of statuses; track s) { <option [value]="s">{{ 'returns.status.' + s | translate }}</option> }
              </select></div>
              <div class="w-36"><select (change)="setReason($any($event.target).value)" [attr.aria-label]="'returns.fields.reason' | translate" class="${FIELD}">
                <option value="">{{ 'returns.allReasons' | translate }}</option>
                @for (r of reasons; track r) { <option [value]="r">{{ 'returns.reason.' + r | translate }}</option> }
              </select></div>
              <div class="w-32"><app-date-picker [formControl]="from" [placeholder]="'counter.bills.from' | translate" inputId="rl-from" /></div>
              <div class="w-32"><app-date-picker [formControl]="to" [placeholder]="'counter.bills.to' | translate" inputId="rl-to" /></div>
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
                @for (n of result()?.items ?? []; track n.id) {
                  <li [class.bg-gold-50]="n.id === selectedId()">
                    <button type="button" (click)="openView(n.id)" class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-charcoal-700" [attr.aria-current]="n.id === selectedId() ? 'true' : null">
                      <span class="min-w-0 flex-1"><span class="block whitespace-nowrap font-mono text-xs font-medium text-primary-fg">{{ n.number }}</span><span class="block truncate text-xs text-gray-500">{{ n.schoolName }}</span></span>
                      <span class="shrink-0 text-right"><span class="block font-mono text-sm" [class.line-through]="n.status === 'CANCELLED'">{{ n.grandTotal | number: '1.2-2' }}</span><span class="block text-[11px] text-gray-500">{{ n.noteDate | date: 'dd MMM yy' }}</span></span>
                    </button>
                  </li>
                } @empty { @if (!loadError()) { <li class="py-8 text-center text-sm text-gray-400">{{ 'returns.empty' | translate }}</li> } }
              }
            </ul>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.number' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.fields.school' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.fields.invoice' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.date' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.fields.reason' | translate }}</th>
                    <th class="px-4 py-3 font-semibold">{{ 'returns.columns.status' | translate }}</th>
                    <th class="px-4 py-3 text-right font-semibold">{{ 'sales.totals.grandTotal' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (loading() && !result()) {
                    @for (i of skeletonRows; track i) { <tr><td colspan="7" class="px-4 py-3"><app-skeleton-loader width="100%" /></td></tr> }
                  } @else {
                    @for (n of result()?.items ?? []; track n.id) {
                      <tr class="cursor-pointer transition-colors hover:bg-brand-50/60" (click)="openView(n.id)" (keydown.enter)="openView(n.id)" tabindex="0">
                        <td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-primary-fg">{{ n.number }}</td>
                        <td class="px-4 py-3 text-gray-700"><div>{{ n.schoolName }}</div><div class="font-mono text-xs text-gray-500">{{ n.schoolCode }}</div></td>
                        <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{{ n.invoiceNumber || '-' }}</td>
                        <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ n.noteDate | date: 'dd MMM yy' }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ 'returns.reason.' + n.reason | translate }}</td>
                        <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="statusClass(n.status)">{{ 'returns.status.' + n.status | translate }}</span></td>
                        <td class="whitespace-nowrap px-4 py-3 text-right font-mono" [class.line-through]="n.status === 'CANCELLED'">{{ n.grandTotal | number: '1.2-2' }}</td>
                      </tr>
                    } @empty { @if (!loadError()) { <tr><td colspan="7" class="py-10 text-center text-sm text-gray-400">{{ 'returns.empty' | translate }}</td></tr> } }
                  }
                </tbody>
              </table>
            </div>
          }
          <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goToPage($event)" />
        </div>

        <div detail>
          @switch (panel().mode) {
            @case ('new') { <app-credit-note-add (created)="openCreated($event)" (closed)="closePanel()" /> }
            @default {
              @if (selectedId(); as id) { <app-credit-note-detail [id]="id" (closed)="closePanel()" (changed)="load()" /> }
            }
          }
        </div>
      </app-list-detail>
    </div>
  `,
})
export class ReturnListComponent {
  private readonly returns = inject(ReturnService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly statuses = RETURN_STATUSES;
  readonly reasons = CREDIT_NOTE_REASONS;
  readonly search = new FormControl('', { nonNullable: true });
  readonly from = new FormControl('', { nonNullable: true });
  readonly to = new FormControl('', { nonNullable: true });
  readonly status = signal<ReturnStatus | ''>('');
  readonly reason = signal<CreditNoteReason | ''>('');
  readonly schoolId = signal('');

  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;
  readonly result = signal<PagedList<CreditNoteSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  statusClass = counterBillStatusBadgeClass;

  constructor() {
    for (const control of [this.search, this.from, this.to]) {
      control.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyFilters());
    }
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setSchool(id: string): void {
    this.schoolId.set(id);
    this.applyFilters();
  }

  setStatus(value: string): void {
    this.status.set(value as ReturnStatus | '');
    this.applyFilters();
  }

  setReason(value: string): void {
    this.reason.set(value as CreditNoteReason | '');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openNew(): void {
    void this.router.navigate(['/returns', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/returns', id]);
  }

  closePanel(): void {
    void this.router.navigate(['/returns']);
  }

  /** R54: a credit note that returned more than was sold opens with its yellow warning (the navigation state carries it). */
  openCreated(made: CreditNoteMade): void {
    this.load();
    void this.router.navigate(['/returns', made.creditNoteId], { state: { overReturnedId: made.overReturnedItemIds.length > 0 ? made.creditNoteId : null } });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.returns
      .creditNotes({
        search: this.search.value.trim() || undefined,
        schoolId: this.schoolId() || undefined,
        status: this.status() || undefined,
        reason: this.reason() || undefined,
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
