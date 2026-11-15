import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ItemService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemImportResult, ItemImportRowError } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The "Import items" dialog (item spec R18-R22): download the template, choose the `.xlsx` file (type and size checked before
 * the upload), upload. The answer is either how many items were created and updated, or the server's report of every wrong row
 * (row number, column, the catalogue text of its code); then nothing was changed. Nothing is computed here.
 */
@Component({
  selector: 'app-item-import',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'item.import.title' | translate" (closed)="close()">
      @if (result(); as done) {
        <div class="space-y-4 text-sm" role="status">
          <p class="font-semibold text-primary-fg">{{ 'item.import.done' | translate: { created: done.created, updated: done.updated } }}</p>
          <div class="flex justify-end"><app-button (clicked)="close()">{{ 'item.import.close' | translate }}</app-button></div>
        </div>
      } @else {
        <div class="space-y-4">
          <p class="text-xs text-gray-500">{{ 'item.import.hint' | translate }}</p>
          <app-button variant="secondary" [loading]="downloading()" (clicked)="downloadTemplate()">{{ 'item.import.template' | translate }}</app-button>

          @if (error()) {
            <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
          }
          @if (rows().length > 0) {
            <div class="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
              <p class="mb-2 text-xs font-semibold text-red-700">{{ 'item.import.refused' | translate }}</p>
              <div class="max-h-64 overflow-auto">
                <table class="w-full text-left text-xs">
                  <thead class="text-red-700">
                    <tr>
                      <th class="py-1 pr-3 font-semibold">{{ 'item.import.row' | translate }}</th>
                      <th class="py-1 pr-3 font-semibold">{{ 'item.import.column' | translate }}</th>
                      <th class="py-1 font-semibold">{{ 'item.import.reason' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-red-700">
                    @for (r of rows(); track r.rowNumber) {
                      <tr>
                        <td class="py-1 pr-3 font-mono">{{ r.rowNumber }}</td>
                        <td class="py-1 pr-3">{{ 'item.import.columns.' + r.column | translate }}</td>
                        <td class="py-1">{{ reasonOf(r.code) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <div>
              <label for="si-file" class="mb-1 block text-sm font-semibold">{{ 'item.import.file' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="si-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="choose($any($event.target).files)"
                class="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm" />
            </div>
          <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <app-button variant="secondary" (clicked)="close()">{{ 'users.cancel' | translate }}</app-button>
            <app-button [loading]="uploading()" (clicked)="upload()">{{ 'item.import.submit' | translate }}</app-button>
          </div>
        </div>
      }
    </app-modal>
  `,
})
export class ItemImportComponent {
  open = input(false);
  closed = output<void>();
  /** Items were created or updated: the list reloads. */
  imported = output<void>();

  private readonly items = inject(ItemService);
  private readonly translate = inject(TranslateService);

  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly downloading = signal(false);
  readonly error = signal('');
  readonly rows = signal<ItemImportRowError[]>([]);
  readonly result = signal<ItemImportResult | null>(null);

  choose(files: FileList | null): void {
    this.error.set('');
    this.rows.set([]);
    const file = files?.item(0) ?? null;
    this.file.set(file);
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      this.error.set(this.translate.instant('item.import.notXlsx'));
    } else if (file && file.size > MAX_BYTES) {
      this.error.set(this.translate.instant('item.import.tooLarge'));
    }
  }

  upload(): void {
    const file = this.file();
    if (!file) {
      this.error.set(this.translate.instant('item.import.required'));
      return;
    }
    if (this.error() || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.rows.set([]);
    this.items.importItems(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.result.set(result);
        this.imported.emit();
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        const rows = error instanceof HttpErrorResponse ? (error.error as { rows?: ItemImportRowError[] } | null)?.rows : undefined;
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
    this.items.importTemplate().subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'items-template.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading.set(false);
        this.error.set(this.translate.instant('item.import.templateError'));
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
    this.result.set(null);
    this.closed.emit();
  }
}
