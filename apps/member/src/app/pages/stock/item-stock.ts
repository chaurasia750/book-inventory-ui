import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthService } from '@org/auth';
import { StockService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AdjustStockRequest, EnterOpeningRequest, ItemStock } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { StockAdjustmentFormComponent } from './stock-adjustment-form';
import { StockOpeningFormComponent } from './stock-opening-form';

/**
 * The stock of one item, shown in the panel beside the stock list (stock spec R7, R8, R10, platform U10): the Main, Damaged and
 * Sample quantities (a warning mark at zero or below), the history newest first with the quantity after each entry and who made
 * it, and for the Owner the opening and the adjustment forms. Staff see the same without the forms.
 */
@Component({
  selector: 'app-item-stock',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent, StockOpeningFormComponent, StockAdjustmentFormComponent],
  templateUrl: './item-stock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemStockComponent {
  /** The item whose stock is open beside the list; a new id loads that item. */
  readonly id = input.required<string>();
  readonly closed = output<void>();
  /** An opening or an adjustment was posted: the list beside it reloads. */
  readonly changed = output<void>();

  private readonly stock = inject(StockService);
  private readonly translate = inject(TranslateService);

  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly data = signal<ItemStock | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly form = signal<'opening' | 'adjustment' | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');

  constructor() {
    effect(() => {
      this.id();
      untracked(() => {
        this.form.set(null);
        this.load();
      });
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.stock.ofItem(this.id()).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.data.set(data);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.data.set(null);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  open(form: 'opening' | 'adjustment'): void {
    this.saveError.set('');
    this.form.set(form);
  }

  enterOpening(request: EnterOpeningRequest): void {
    this.post(this.stock.enterOpening(this.id(), request));
  }

  adjust(request: AdjustStockRequest): void {
    this.post(this.stock.adjust(this.id(), request));
  }

  private post(call: Observable<unknown>): void {
    this.saving.set(true);
    this.saveError.set('');
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.form.set(null);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.saveError.set(messageForError(error, this.translate));
      },
    });
  }
}
