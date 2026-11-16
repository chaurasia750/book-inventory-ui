import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ReceiptDetail, SchoolDues } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';
import { IndianCurrencyPipe } from '../counters/indian-currency.pipe';
import { MoneyPipe } from '../counters/money.pipe';
import { MoneyPrefixComponent } from '../counters/money-prefix';

const money = (value: number): number => Math.round(value * 100) / 100;

/**
 * Applies the advance of a receipt to the school's open invoices (payment spec R13): oldest invoice first (the preview here only
 * repeats what the server does) or by hand. Nothing is posted to the ledger: the money is already in the school's credit.
 */
@Component({
  selector: 'app-adjust-advance-panel',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, MoneyPipe, IndianCurrencyPipe, MoneyPrefixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-charcoal-700" role="group" [attr.aria-label]="'payment.adjust.title' | translate">
      <p class="m-0 text-sm font-semibold">{{ 'payment.adjust.title' | translate }}: <span class="font-mono">{{ receipt().advanceAmount | money }}</span></p>
      @if (loading()) {
        <p class="m-0 text-xs text-gray-500">{{ 'payment.receive.loading' | translate }}</p>
      } @else if (dues(); as d) {
        @if (d.openInvoices.length === 0) {
          <p class="m-0 text-xs text-gray-500">{{ 'payment.adjust.noOpen' | translate }}</p>
        } @else {
          <table class="w-full text-left text-xs">
            <thead class="text-[11px] uppercase tracking-[0.05em] text-gray-500">
              <tr>
                <th class="py-1 pr-3 font-semibold">{{ 'sales.columns.number' | translate }}</th>
                <th class="py-1 pr-3 text-right font-semibold">{{ 'payment.receive.due' | translate }}</th>
                <th class="py-1 text-right font-semibold">{{ 'payment.receive.applied' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (o of d.openInvoices; track o.invoiceId) {
                <tr>
                  <td class="py-1 pr-3 font-mono">{{ o.number }}</td>
                  <td class="py-1 pr-3 text-right font-mono">{{ o.due | inr }}</td>
                  <td class="py-1 text-right">
                    @if (manual()) {
                      <app-money-prefix [inline]="true"><input type="number" min="0" step="0.01" [value]="amounts()[o.invoiceId] ?? ''" (input)="setAmount(o.invoiceId, $any($event.target).value)" [attr.aria-label]="o.number"
                        class="h-8 w-28 rounded border border-gray-300 px-2 text-right text-xs" /></app-money-prefix>
                    } @else { <span class="font-mono">{{ preview()[o.invoiceId] ?? 0 | inr }}</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <label class="flex items-center gap-2 text-xs">
            <input type="checkbox" class="h-4 w-4" [checked]="manual()" (change)="manual.set($any($event.target).checked)" />
            {{ 'payment.receive.byHand' | translate }}
          </label>
        }
      }
      @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
      <div class="flex justify-end gap-2">
        <app-button size="sm" variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button size="sm" [loading]="saving()" [disabled]="!canSave()" (clicked)="save()">{{ 'payment.adjust.apply' | translate }}</app-button>
      </div>
    </div>
  `,
})
export class AdjustAdvancePanelComponent {
  readonly receipt = input.required<ReceiptDetail>();
  /** The advance was applied. */
  readonly done = output<void>();
  readonly cancelled = output<void>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly dues = signal<SchoolDues | null>(null);
  readonly loading = signal(true);
  readonly manual = signal(false);
  readonly amounts = signal<Partial<Record<string, string>>>({});
  readonly saving = signal(false);
  readonly error = signal('');

  /** R13, R6: the oldest-first plan the server will make for the advance (a preview). */
  readonly preview = computed<Partial<Record<string, number>>>(() => {
    const plan: Partial<Record<string, number>> = {};
    let left = this.receipt().advanceAmount;
    for (const o of this.dues()?.openInvoices ?? []) {
      const take = money(Math.min(left, o.due));
      if (take > 0) {
        plan[o.invoiceId] = take;
        left = money(left - take);
      }
    }
    return plan;
  });

  readonly canSave = computed(() => {
    const open = (this.dues()?.openInvoices.length ?? 0) > 0;
    if (!open) {
      return false;
    }
    const applied = this.manual() ? Object.values(this.amounts()).reduce<number>((sum, v) => sum + (Number(v) || 0), 0) : Object.values(this.preview()).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
    return applied > 0 && money(applied) <= this.receipt().advanceAmount;
  });

  constructor() {
    effect(() => {
      const schoolId = this.receipt().summary.schoolId;
      untracked(() => this.load(schoolId));
    });
  }

  setAmount(invoiceId: string, value: string): void {
    this.amounts.update((m) => ({ ...m, [invoiceId]: value }));
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const allocations = this.manual()
      ? Object.entries(this.amounts())
          .map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) }))
          .filter((a) => a.amount > 0)
      : undefined;
    this.payments.adjustAdvance(this.receipt().summary.id, allocations).subscribe({
      next: () => {
        this.saving.set(false);
        this.done.emit();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  private load(schoolId: string): void {
    this.loading.set(true);
    this.payments.dues(schoolId).subscribe({
      next: (d) => {
        this.dues.set(d);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
