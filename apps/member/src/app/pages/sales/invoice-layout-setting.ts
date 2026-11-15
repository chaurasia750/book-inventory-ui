import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { InvoiceLayout } from '@org/shared-models';

/**
 * Sales spec R26: the layout a school's invoices open in (book list or by class), on the school's profile. The Owner changes it;
 * Staff see it. A view choice only: no invoice changes with it.
 */
@Component({
  selector: 'app-invoice-layout-setting',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-charcoal-700">
      <div>
        <label for="ils-layout" class="block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'sales.layout.label' | translate }}</label>
        <p class="m-0 text-xs text-gray-500">{{ 'sales.layout.hint' | translate }}</p>
      </div>
      <select id="ils-layout" [value]="layout()" [disabled]="!canEdit()" (change)="change($any($event.target).value)"
        class="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50">
        @for (l of layouts; track l) { <option [value]="l">{{ 'sales.layout.' + l | translate }}</option> }
      </select>
      @if (message()) { <span class="text-xs" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</span> }
    </div>
  `,
})
export class InvoiceLayoutSettingComponent {
  readonly schoolId = input.required<string>();
  readonly canEdit = input(false);

  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);

  readonly layouts: InvoiceLayout[] = ['BOOK_LIST', 'BY_CLASS'];
  readonly layout = signal<InvoiceLayout>('BOOK_LIST');
  readonly message = signal('');
  readonly isError = signal(false);

  constructor() {
    effect(() => {
      const id = this.schoolId();
      untracked(() => this.sales.invoiceLayout(id).subscribe({ next: (r) => this.layout.set(r.layout), error: (e: unknown) => this.show(messageForError(e, this.translate), true) }));
    });
  }

  change(value: string): void {
    const layout = value as InvoiceLayout;
    this.sales.changeInvoiceLayout(this.schoolId(), layout).subscribe({
      next: (r) => {
        this.layout.set(r.layout);
        this.show(this.translate.instant('sales.layout.saved'), false);
      },
      error: (e: unknown) => this.show(messageForError(e, this.translate), true),
    });
  }

  private show(text: string, error: boolean): void {
    this.message.set(text);
    this.isError.set(error);
  }
}
