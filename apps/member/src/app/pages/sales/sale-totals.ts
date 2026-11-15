import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { GstMode, SaleTotals } from '@org/shared-models';

/**
 * The totals of an order or invoice (sales spec R7), exactly as the server computed them: subtotal, total discount, taxable value,
 * the GST split (CGST + SGST or IGST; no GST rows when GST is off, BR-GST-06), round-off and the grand total.
 */
@Component({
  selector: 'app-sale-totals',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totals(); as t) {
      <dl class="grid gap-1.5 text-sm">
        <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.subtotal' | translate }}</dt><dd class="font-mono">{{ t.subtotal | number: '1.2-2' }}</dd></div>
        @if (t.totalDiscount) {
          <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.totalDiscount' | translate }}</dt><dd class="font-mono">- {{ t.totalDiscount | number: '1.2-2' }}</dd></div>
        }
        <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.taxable' | translate }}</dt><dd class="font-mono">{{ t.taxable | number: '1.2-2' }}</dd></div>
        @if (gstMode() === 'SAME_STATE') {
          <div class="flex justify-between"><dt class="text-gray-500">CGST</dt><dd class="font-mono">{{ t.cgst | number: '1.2-2' }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">SGST</dt><dd class="font-mono">{{ t.sgst | number: '1.2-2' }}</dd></div>
        }
        @if (gstMode() === 'OTHER_STATE') {
          <div class="flex justify-between"><dt class="text-gray-500">IGST</dt><dd class="font-mono">{{ t.igst | number: '1.2-2' }}</dd></div>
        }
        <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.roundOff' | translate }}</dt><dd class="font-mono">{{ t.roundOff | number: '1.2-2' }}</dd></div>
        <div class="mt-1 flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-charcoal-700">
          <dt>{{ 'sales.totals.grandTotal' | translate }}</dt><dd class="font-mono">{{ t.grandTotal | number: '1.2-2' }}</dd>
        </div>
      </dl>
    }
  `,
})
export class SaleTotalsComponent {
  readonly totals = input<SaleTotals | null>(null);
  readonly gstMode = input<GstMode>('NOT_APPLIED');
}
