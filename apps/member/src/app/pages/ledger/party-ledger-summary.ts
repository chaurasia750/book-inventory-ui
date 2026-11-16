import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LedgerService } from '@org/api-services';
import { LedgerStatement } from '@org/shared-models';
import { MoneyPipe } from '../counters/money.pipe';

/**
 * The money tiles in a school's or vendor's profile header (finance spec R7, R9, section 6): the opening balance typed on the
 * master, the total debit and total credit of every ledger entry, and the balance (what the school owes, or what the company owes
 * the vendor; red when something is due, a negative balance is an advance). The figures are the server's statement totals.
 */
@Component({
  selector: 'app-party-ledger-summary',
  standalone: true,
  imports: [TranslatePipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (summary(); as s) {
      <div class="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))] dark:border-charcoal-700 dark:bg-charcoal-700">
        <div class="bg-white px-3 py-2.5 dark:bg-charcoal-800">
          <div class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'ledger.tiles.opening' | translate }}</div>
          <div class="mt-0.5 font-mono text-[17px] font-semibold text-primary-fg">{{ opening() | money }}</div>
        </div>
        <div class="bg-white px-3 py-2.5 dark:bg-charcoal-800">
          <div class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'ledger.tiles.debit' | translate }}</div>
          <div class="mt-0.5 font-mono text-[17px] font-semibold text-primary-fg">{{ s.totalDebit | money }}</div>
        </div>
        <div class="bg-white px-3 py-2.5 dark:bg-charcoal-800">
          <div class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'ledger.tiles.credit' | translate }}</div>
          <div class="mt-0.5 font-mono text-[17px] font-semibold text-primary-fg">{{ s.totalCredit | money }}</div>
        </div>
        <div class="px-3 py-2.5" [class]="s.closingBalance > 0 ? 'bg-red-50 dark:bg-charcoal-800' : 'bg-white dark:bg-charcoal-800'">
          <div class="text-[11px] font-semibold uppercase tracking-[0.05em]" [class]="s.closingBalance > 0 ? 'text-red-700' : 'text-gray-500'">
            {{ (party() === 'schools' ? 'ledger.balance.school' : 'ledger.balance.vendor') | translate }}
          </div>
          <div class="mt-0.5 font-mono text-[17px] font-semibold" [class]="s.closingBalance > 0 ? 'text-red-700' : 'text-green-700'">{{ s.closingBalance | money }}</div>
          @if (s.closingBalance < 0) { <div class="mt-0.5 text-[11px] text-gray-500">{{ 'ledger.tiles.advance' | translate }}</div> }
        </div>
      </div>
    }
  `,
})
export class PartyLedgerSummaryComponent {
  readonly party = input.required<'schools' | 'vendors'>();
  readonly id = input.required<string>();
  /** The opening balance typed on the school or vendor. */
  readonly opening = input(0);

  private readonly ledger = inject(LedgerService);

  readonly summary = signal<LedgerStatement | null>(null);

  constructor() {
    effect(() => {
      const party = this.party();
      const id = this.id();
      untracked(() => {
        this.summary.set(null);
        this.ledger.statement(party, id, {}).subscribe({ next: (s) => this.summary.set(s), error: () => this.summary.set(null) });
      });
    });
  }
}
