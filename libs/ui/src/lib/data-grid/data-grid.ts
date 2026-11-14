import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface DataGridColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortEvent {
  key: string;
  dir: SortDirection;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridComponent {
  columns = input<DataGridColumn[]>([]);
  rows = input<any[]>([]);
  loading = input(false);

  page = input(1);
  pageSize = input(10);
  total = input(0);

  pageChange = output<number>();
  sortChange = output<SortEvent>();

  private sortKey = signal<string | null>(null);
  private sortDir = signal<SortDirection>('asc');

  currentSortKey = computed(() => this.sortKey());
  currentSortDir = computed(() => this.sortDir());

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));

  onSort(col: DataGridColumn): void {
    if (!col.sortable) {
      return;
    }
    if (this.sortKey() === col.key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
    this.sortChange.emit({ key: col.key, dir: this.sortDir() });
  }

  goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages() || nextPage === this.page()) {
      return;
    }
    this.pageChange.emit(nextPage);
  }

  cellValue(row: any, key: string): any {
    return row?.[key];
  }
}
