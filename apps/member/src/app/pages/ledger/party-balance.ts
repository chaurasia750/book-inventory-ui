import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LedgerService } from '@org/api-services';

/**
 * The balance in the header of a school's or vendor's profile (finance spec R7, R17, section 6): what the school owes, or what
 * the company owes the vendor; a negative balance is an advance. The Owner's only; shows nothing until it is loaded or on error.
 */
@Component({
  selector: 'app-party-balance',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (balance() !== null) {
      <span class="rounded-xl bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
        {{ (party() === 'schools' ? 'ledger.balance.school' : 'ledger.balance.vendor') | translate }}:
        <span class="font-mono font-semibold" [class.text-red-600]="(balance() ?? 0) < 0" [class.text-primary-fg]="(balance() ?? 0) >= 0">{{ balance() | number: '1.2-2' }}</span>
      </span>
    }
  `,
})
export class PartyBalanceComponent {
  readonly party = input.required<'schools' | 'vendors'>();
  readonly id = input.required<string>();

  private readonly ledger = inject(LedgerService);

  readonly balance = signal<number | null>(null);

  constructor() {
    effect(() => {
      const party = this.party();
      const id = this.id();
      untracked(() => {
        this.balance.set(null);
        this.ledger.balances(party, [id]).subscribe({ next: (b) => this.balance.set(b[id] ?? 0), error: () => this.balance.set(null) });
      });
    });
  }
}
