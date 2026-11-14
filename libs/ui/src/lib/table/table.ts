import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  columns = input<TableColumn[]>([]);
  rows = input<any[]>([]);
  loading = input(false);

  rowClick = output<any>();

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  cellValue(row: any, key: string): any {
    return row?.[key];
  }
}
