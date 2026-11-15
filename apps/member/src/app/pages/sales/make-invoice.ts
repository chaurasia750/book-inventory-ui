import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SchoolOrderDetail } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, ModalComponent } from '@org/ui';

/**
 * "Make invoice" on a confirmed order (sales spec R8, R9): the quantity of each line delivered now (its remaining quantity by
 * default, never more) and the invoice date (today by default). The server numbers it, computes it and posts stock and ledger.
 */
@Component({
  selector: 'app-make-invoice',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'sales.invoices.make' | translate" (closed)="closed.emit()">
      <div class="space-y-3">
        <div class="w-48">
          <label for="mi-date" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'sales.invoices.date' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-date-picker inputId="mi-date" [formControl]="date" />
        </div>
        <div class="max-h-80 overflow-auto rounded-lg border border-neutral-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 text-[11px] uppercase text-gray-500">
              <tr><th class="px-3 py-2">{{ 'sales.columns.item' | translate }}</th><th class="px-3 py-2 text-right">{{ 'sales.columns.remaining' | translate }}</th><th class="px-3 py-2 text-right">{{ 'sales.invoices.now' | translate }}</th></tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              @for (l of order().lines; track l.id; let i = $index) {
                <tr>
                  <td class="px-3 py-2">{{ l.item.name }} <span class="font-mono text-gray-500">{{ l.item.code }}</span></td>
                  <td class="px-3 py-2 text-right">{{ l.remainingQuantity }}</td>
                  <td class="px-3 py-2 text-right">
                    <input type="number" min="0" [max]="l.remainingQuantity" step="1" [value]="quantities()[i]" (change)="setQuantity(i, +$any($event.target).value)"
                      class="h-8 w-20 rounded border border-gray-300 px-2 text-right text-xs" [attr.aria-label]="'sales.invoices.now' | translate" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
          <app-button [loading]="saving()" (clicked)="submit()">{{ 'sales.invoices.make' | translate }}</app-button>
        </div>
      </div>
    </app-modal>
  `,
})
export class MakeInvoiceComponent {
  readonly open = input(false);
  readonly order = input.required<SchoolOrderDetail>();
  readonly closed = output<void>();
  readonly made = output<string>();

  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);

  readonly date = new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true });
  readonly quantities = signal<number[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');

  constructor() {
    effect(() => {
      const lines = this.order().lines;
      untracked(() => this.quantities.set(lines.map((l) => l.remainingQuantity)));
    });
  }

  setQuantity(index: number, value: number): void {
    this.quantities.update((q) => q.map((v, i) => (i === index ? value : v)));
  }

  submit(): void {
    this.saving.set(true);
    this.error.set('');
    const lines = this.order().lines.map((l, i) => ({ orderLineId: l.id, quantity: this.quantities()[i] ?? 0 }));
    this.sales.makeInvoice(this.order().id, { invoiceDate: this.date.value || undefined, lines }).subscribe({
      next: (made) => {
        this.saving.set(false);
        this.made.emit(made.invoiceId);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
