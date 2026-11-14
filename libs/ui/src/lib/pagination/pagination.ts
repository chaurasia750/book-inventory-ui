import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
        <span class="text-xs text-gray-500">
          Showing {{ (page() - 1) * pageSize() + 1 }}&ndash;{{ Math.min(page() * pageSize(), total()) }} of {{ total() }}
        </span>
        <nav class="flex items-center gap-1">
          <button (click)="goToPage(page() - 1)" [disabled]="page() <= 1"
            class="inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          @for (p of visiblePages(); track p) {
            <button (click)="goToPage(p)"
              class="inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors"
              [class]="p === page()
                ? 'bg-brand-500 text-black shadow-sm'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'">
              {{ p }}
            </button>
          }
          <button (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages()"
            class="inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </nav>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly Math = Math;
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly total = input(0);
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));

  readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.page();
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages() || nextPage === this.page()) {
      return;
    }
    this.pageChange.emit(nextPage);
  }
}
