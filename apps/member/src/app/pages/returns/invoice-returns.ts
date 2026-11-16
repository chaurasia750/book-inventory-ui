import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ReturnService } from '@org/api-services';
import { InvoiceReturns } from '@org/shared-models';
import { MoneyPipe } from '../counters/money.pipe';

/**
 * The "Returns" block of an invoice's detail (sales spec R54, R61): the credit notes made against the invoice and, for each line,
 * how much was sold and how much live credit notes returned. It shows nothing when the invoice has had no return.
 */
@Component({
  selector: 'app-invoice-returns',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (returns(); as r) {
      @if (r.creditNotes.length > 0) {
        <section class="rounded-[10px] border border-neutral-200 bg-white px-4 py-3 dark:border-charcoal-700 dark:bg-charcoal-800">
          <h2 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'returns.invoiceBlock.title' | translate }}</h2>
          <ul class="m-0 list-none divide-y divide-neutral-100 p-0 text-sm dark:divide-charcoal-700">
            @for (n of r.creditNotes; track n.id) {
              <li class="flex items-center justify-between gap-3 py-1.5">
                <a [routerLink]="['/returns', n.id]" class="font-mono text-xs font-medium text-brand-700 hover:underline">{{ n.number }}</a>
                <span class="text-xs text-gray-500">{{ n.noteDate }} · {{ 'returns.reason.' + n.reason | translate }}</span>
                <span class="font-mono" [class.line-through]="n.status === 'CANCELLED'">{{ n.grandTotal | money }}</span>
              </li>
            }
          </ul>
          <p class="m-0 mt-2 text-xs text-gray-500">
            @for (l of r.lines; track l.invoiceLineId) {
              @if (l.returnedQuantity > 0) { <span class="mr-3">{{ l.itemCode }}: {{ 'returns.invoiceBlock.returned' | translate }} {{ l.returnedQuantity }} / {{ l.soldQuantity }}</span> }
            }
          </p>
        </section>
      }
    }
  `,
})
export class InvoiceReturnsComponent {
  private readonly service = inject(ReturnService);

  readonly invoiceId = input.required<string>();
  readonly returns = signal<InvoiceReturns | null>(null);

  constructor() {
    effect(() => {
      const id = this.invoiceId();
      untracked(() => this.service.invoiceReturns(id).subscribe({ next: (r) => this.returns.set(r), error: () => this.returns.set(null) }));
    });
  }
}
