import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { ItemService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemDetail } from '@org/shared-models';
import { itemStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

/**
 * One item (item spec R2-R9): the master data with the generated code read-only, the vendor's name, the barcode editor
 * (add, remove, save; a barcode of another item is refused by the API with its catalogue message, R6) and activate /
 * deactivate. The edit form opens in the panel through the page (`editRequested`). Staff see everything read-only.
 */
@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent],
  templateUrl: './item-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailComponent {
  /** The item open beside the list (platform U10); a new id loads that item. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The item's name or status changed: the list beside it reloads. */
  readonly changed = output<void>();
  /** The Edit button: the page opens the edit form in the panel. */
  readonly editRequested = output<void>();

  private readonly items = inject(ItemService);
  private readonly translate = inject(TranslateService);

  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly item = signal<ItemDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly barcodes = signal<string[]>([]);
  readonly barcodesDirty = signal(false);
  readonly barcodesSaving = signal(false);
  readonly barcodesError = signal('');
  readonly newBarcode = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = itemStatusBadgeClass;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.items.get(this.id()).subscribe({
      next: (item) => {
        this.loading.set(false);
        this.item.set(item);
        this.resetBarcodes(item);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  setNewBarcode(value: string): void {
    this.newBarcode.set(value);
  }

  addBarcode(): void {
    const barcode = this.newBarcode().trim().toUpperCase();
    if (!barcode) {
      return;
    }

    if (this.barcodes().includes(barcode)) {
      this.barcodesError.set(this.translate.instant('item.barcodes.duplicate'));
      return;
    }

    this.barcodesError.set('');
    this.barcodes.update((list) => [...list, barcode]);
    this.newBarcode.set('');
    this.barcodesDirty.set(true);
  }

  removeBarcode(index: number): void {
    this.barcodes.update((list) => list.filter((_, i) => i !== index));
    this.barcodesDirty.set(true);
  }

  discardBarcodes(): void {
    const item = this.item();
    if (item) {
      this.resetBarcodes(item);
    }
  }

  saveBarcodes(): void {
    this.barcodesSaving.set(true);
    this.barcodesError.set('');
    this.items.replaceBarcodes(this.id(), this.barcodes()).subscribe({
      next: () => {
        this.barcodesSaving.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.barcodesSaving.set(false);
        this.barcodesError.set(messageForError(error, this.translate));
      },
    });
  }

  openStatus(): void {
    this.statusError.set('');
    this.statusOpen.set(true);
  }

  changeStatus(): void {
    const item = this.item();
    if (!item) {
      return;
    }

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = item.status === 'ACTIVE' ? this.items.deactivate(this.id()) : this.items.activate(this.id());
    call.subscribe({
      next: () => {
        this.statusSaving.set(false);
        this.statusOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.statusSaving.set(false);
        this.statusError.set(messageForError(error, this.translate));
      },
    });
  }

  private resetBarcodes(item: ItemDetail): void {
    this.barcodes.set([...item.barcodes]);
    this.barcodesDirty.set(false);
    this.barcodesError.set('');
  }
}
