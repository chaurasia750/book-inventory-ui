import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LedgerService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { OutstandingPage } from '@org/shared-models';
import { ButtonComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';

const PAGE_SIZE = 20;

/**
 * The "with a balance only" view of the school or vendor list (finance spec R11, R16, section 6): every party with a non-zero
 * balance, largest first, with the total of the list, searched by the list's search text and paged. Clicking a row opens that
 * party's profile, exactly like the normal list. The Owner's only (R13).
 */
@Component({
  selector: 'app-outstanding-table',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, ButtonComponent, PaginationComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (result(); as r) {
      <div class="flex justify-end border-b border-neutral-100 px-4 py-2 text-sm text-gray-600">
        {{ 'ledger.total' | translate }}:&nbsp;<span class="font-mono font-semibold text-primary-fg">{{ r.totalBalance | number: '1.2-2' }}</span>
      </div>
    }
    @if (loadError()) {
      <div class="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
        <span>{{ loadError() }}</span>
        <app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
      </div>
    }
    <ul class="m-0 list-none divide-y divide-neutral-100 p-0 dark:divide-charcoal-700">
      @if (loading()) {
        @for (i of skeletonRows; track i) { <li class="px-4 py-3"><app-skeleton-loader width="100%" /></li> }
      } @else {
        @for (row of result()?.items ?? []; track row.partyId) {
          <li>
            <button type="button" (click)="opened.emit(row.partyId)" class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-charcoal-700"
              [class.bg-gold-50]="row.partyId === selectedId()">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-primary-fg">
                  {{ row.name }}
                  @if (!row.isActive) { <span class="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{{ 'ledger.inactive' | translate }}</span> }
                </span>
                <span class="block font-mono text-xs text-gray-500">{{ row.code }}</span>
              </span>
              <span class="font-mono text-sm font-semibold" [class.text-red-600]="row.balance < 0">{{ row.balance | number: '1.2-2' }}</span>
            </button>
          </li>
        } @empty {
          @if (!loadError()) { <li class="py-8 text-center text-sm text-gray-400">{{ 'ledger.empty' | translate }}</li> }
        }
      }
    </ul>
    <app-pagination [page]="page()" [pageSize]="pageSize" [total]="result()?.totalCount ?? 0" (pageChange)="goToPage($event)" />
  `,
})
export class OutstandingTableComponent {
  readonly party = input.required<'schools' | 'vendors'>();
  /** The list's search text (name or code). */
  readonly search = input('');
  /** The party whose profile is open beside the list, to mark its row. */
  readonly selectedId = input<string | null>(null);
  readonly opened = output<string>();

  private readonly ledger = inject(LedgerService);
  private readonly translate = inject(TranslateService);

  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;
  readonly result = signal<OutstandingPage | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3];

  constructor() {
    effect(() => {
      this.party();
      this.search();
      untracked(() => {
        this.page.set(1);
        this.load();
      });
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.ledger.outstanding(this.party(), { search: this.search().trim() || undefined, pageIndex: this.page(), pageSize: PAGE_SIZE }).subscribe({
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
