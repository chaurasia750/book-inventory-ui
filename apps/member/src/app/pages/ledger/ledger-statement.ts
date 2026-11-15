import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LedgerService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { LedgerStatement, LedgerStatementParams } from '@org/shared-models';
import { ButtonComponent, CardComponent, DatePickerComponent, SkeletonLoaderComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

type FilterKind = 'ALL' | 'YEAR' | 'SESSION' | 'DATES';

/**
 * The Ledger tab of a school's or vendor's profile (finance spec R9, R10, section 6): one filter at a
 * time (all, a financial year, a session for schools, or a date range), the opening row, every entry with its running balance,
 * and the totals. A school's balance is what it owes, a vendor's what the company owes (R7); a negative balance is an advance.
 * Nothing is computed here: the statement is the server's.
 */
@Component({
  selector: 'app-ledger-statement',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, SkeletonLoaderComponent, DatePickerComponent],
  templateUrl: './ledger-statement.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerStatementComponent {
  readonly party = input.required<'schools' | 'vendors'>();
  /** The school's or vendor's id; a new id loads its statement. */
  readonly id = input.required<string>();

  private readonly ledger = inject(LedgerService);
  private readonly translate = inject(TranslateService);

  readonly field = FIELD;

  readonly filters = new FormGroup({
    kind: new FormControl<FilterKind>('ALL', { nonNullable: true }),
    financialYear: new FormControl('', { nonNullable: true }),
    session: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly statement = signal<LedgerStatement | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  constructor() {
    effect(() => {
      this.id();
      this.party();
      untracked(() => {
        this.filters.reset({ kind: 'ALL', financialYear: '', session: '', from: '', to: '' });
        this.load();
      });
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.ledger.statement(this.party(), this.id(), this.params()).subscribe({
      next: (statement) => {
        this.loading.set(false);
        this.statement.set(statement);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.statement.set(null);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  private params(): LedgerStatementParams {
    const f = this.filters.getRawValue();
    switch (f.kind) {
      case 'YEAR':
        return { financialYear: f.financialYear.trim() || undefined };
      case 'SESSION':
        return { session: f.session.trim() || undefined };
      case 'DATES':
        return { from: f.from || undefined, to: f.to || undefined };
      default:
        return {};
    }
  }
}
