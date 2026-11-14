import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { StockService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { OpeningImportRowError } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The "Import opening stock" dialog (stock spec R17, R18): download the template, choose the `.xlsx` file (type and size checked
 * before the upload) and the opening date, upload. The answer is either the number imported, or the server's report of every wrong
 * row (row number, column, the catalogue text of its code); then nothing was imported. Nothing is computed here.
 */
@Component({
  selector: 'app-stock-import',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'stock.import.title' | translate" (closed)="close()">
      @if (importedCount() !== null) {
        <div class="space-y-4 text-sm" role="status">
          <p class="font-semibold text-primary-fg">{{ 'stock.import.done' | translate: { count: importedCount() } }}</p>
          <div class="flex justify-end"><app-button (clicked)="close()">{{ 'stock.import.close' | translate }}</app-button></div>
        </div>
      } @else {
        <div class="space-y-4">
          <p class="text-xs text-gray-500">{{ 'stock.import.hint' | translate }}</p>
          <app-button variant="secondary" [loading]="downloading()" (clicked)="downloadTemplate()">{{ 'stock.import.template' | translate }}</app-button>

          @if (error()) {
            <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
          }
          @if (rows().length > 0) {
            <div class="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
              <p class="mb-2 text-xs font-semibold text-red-700">{{ 'stock.import.refused' | translate }}</p>
              <div class="max-h-64 overflow-auto">
                <table class="w-full text-left text-xs">
                  <thead class="text-red-700">
                    <tr>
                      <th class="py-1 pr-3 font-semibold">{{ 'stock.import.row' | translate }}</th>
                      <th class="py-1 pr-3 font-semibold">{{ 'stock.import.column' | translate }}</th>
                      <th class="py-1 font-semibold">{{ 'stock.import.reason' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-red-700">
                    @for (r of rows(); track r.rowNumber) {
                      <tr>
                        <td class="py-1 pr-3 font-mono">{{ r.rowNumber }}</td>
                        <td class="py-1 pr-3">{{ 'stock.import.columns.' + r.column | translate }}</td>
                        <td class="py-1">{{ reasonOf(r.code) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="si-file" class="mb-1 block text-sm font-semibold">{{ 'stock.import.file' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="si-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="choose($any($event.target).files)"
                class="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm" />
            </div>
            <div>
              <label for="si-date" class="mb-1 block text-sm font-semibold">{{ 'stock.import.openingDate' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="si-date" type="date" [formControl]="openingDate" class="${FIELD}" />
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <app-button variant="secondary" (clicked)="close()">{{ 'users.cancel' | translate }}</app-button>
            <app-button [loading]="uploading()" (clicked)="upload()">{{ 'stock.import.submit' | translate }}</app-button>
          </div>
        </div>
      }
    </app-modal>
  `,
})
export class StockImportComponent {
  open = input(false);
  closed = output<void>();
  /** Openings were imported: the list reloads. */
  imported = output<number>();

  private readonly stock = inject(StockService);
  private readonly translate = inject(TranslateService);

  readonly openingDate = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly downloading = signal(false);
  readonly error = signal('');
  readonly rows = signal<OpeningImportRowError[]>([]);
  readonly importedCount = signal<number | null>(null);

  choose(files: FileList | null): void {
    this.error.set('');
    this.rows.set([]);
    const file = files?.item(0) ?? null;
    this.file.set(file);
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      this.error.set(this.translate.instant('stock.import.notXlsx'));
    } else if (file && file.size > MAX_BYTES) {
      this.error.set(this.translate.instant('stock.import.tooLarge'));
    }
  }

  upload(): void {
    const file = this.file();
    if (!file || this.openingDate.invalid) {
      this.error.set(this.translate.instant('stock.import.required'));
      return;
    }
    if (this.error() || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.rows.set([]);
    this.stock.importOpening(file, this.openingDate.value).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.importedCount.set(result.imported);
        this.imported.emit(result.imported);
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        const rows = error instanceof HttpErrorResponse ? (error.error as { rows?: OpeningImportRowError[] } | null)?.rows : undefined;
        if (rows?.length) {
          this.rows.set(rows);
        } else {
          this.error.set(messageForError(error, this.translate));
        }
      },
    });
  }

  downloadTemplate(): void {
    this.downloading.set(true);
    this.stock.template().subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'opening-stock-template.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading.set(false);
        this.error.set(this.translate.instant('stock.import.templateError'));
      },
    });
  }

  /** The catalogue text of a row's message code; an unknown code shows the generic text. */
  reasonOf(code: string): string {
    const key = `errors.${code}`;
    const text = this.translate.instant(key);
    return text && text !== key ? text : this.translate.instant('errors.generic');
  }

  close(): void {
    this.file.set(null);
    this.error.set('');
    this.rows.set([]);
    this.importedCount.set(null);
    this.openingDate.reset('');
    this.closed.emit();
  }
}
