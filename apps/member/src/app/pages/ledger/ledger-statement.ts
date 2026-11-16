import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LedgerService, PaymentService, SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { financialYearOptions } from '@org/shared-utils';
import { LedgerStatement, LedgerStatementParams, LedgerStatementRow } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, SkeletonLoaderComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

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
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, SkeletonLoaderComponent, DatePickerComponent],
  templateUrl: './ledger-statement.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerStatementComponent {
  readonly party = input.required<'schools' | 'vendors'>();
  /** The school's or vendor's id; a new id loads its statement. */
  readonly id = input.required<string>();

  private readonly ledger = inject(LedgerService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly sales = inject(SalesService);
  private readonly payments = inject(PaymentService);

  readonly field = FIELD;

  /** The filter choices; the session filter is the schools' only (R9). */
  /** The financial years and the sessions are chosen from a list, like everywhere else, not typed. */
  readonly years = financialYearOptions();
  readonly sessionOptions = signal<string[]>([]);

  readonly kinds = computed<FilterKind[]>(() => (this.party() === 'schools' ? ['ALL', 'YEAR', 'SESSION', 'DATES'] : ['ALL', 'YEAR', 'DATES']));

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

  /** Finance R19: numbers that no longer find their document; they are shown as plain text from then on. */
  readonly unresolved = signal<ReadonlySet<string>>(new Set());

  /** Finance R19: a school's invoice row links to the invoice, a receipt row to the receipt; the opening balance row and a vendor's rows have no link. */
  documentLinkable(row: LedgerStatementRow): boolean {
    return this.party() === 'schools' && (row.documentType === 'SCHOOL_INVOICE' || row.documentType === 'PAYMENT_RECEIPT' || this.chequeReceiptNumber(row) !== null);
  }

  /** Finance R19: the order number printed in the detail of an invoice row (`ORD/2026-27/0001`). */
  orderNumber(row: LedgerStatementRow): string | null {
    const text = row.narration?.trim() ?? '';
    return this.party() === 'schools' && row.documentType === 'SCHOOL_INVOICE' && /^ORD\/\S+$/.test(text) && !this.unresolved().has(text) ? text : null;
  }

  /** Finance R19: the receipt a cheque cleared or bounced row belongs to is named at the start of its detail (`RCP/2026-27/0005: Cheque ...`). */
  chequeReceiptNumber(row: LedgerStatementRow): string | null {
    const cheque = row.documentType === 'CHEQUE_CLEARED' || row.documentType === 'CHEQUE_BOUNCED';
    const match = cheque ? /^(RCP\/\S+?):/.exec(row.narration?.trim() ?? '') : null;
    return match && !this.unresolved().has(match[1]) ? match[1] : null;
  }

  /** Finance R19: opens the invoice or the receipt (beside the school's Payments tab) of a row. */
  openDocument(row: LedgerStatementRow): void {
    const schoolId = this.id();
    if (row.documentType === 'SCHOOL_INVOICE') {
      void this.router.navigate(['/invoices', row.documentId]);
    } else if (row.documentType === 'PAYMENT_RECEIPT') {
      void this.router.navigate(['/schools', schoolId, 'payments', row.documentId]);
    } else {
      const number = this.chequeReceiptNumber(row);
      if (number) {
        this.openReceiptByNumber(number);
      }
    }
  }

  /** Finance R19: finds the order by its number and opens it; a number that finds nothing becomes plain text. */
  openOrder(number: string): void {
    this.sales.orders({ search: number, schoolId: this.id(), pageIndex: 1, pageSize: 5 }).subscribe({
      next: (page) => {
        const order = page.items.find((o) => o.number === number);
        if (order) {
          void this.router.navigate(['/school-orders', order.id]);
        } else {
          this.markUnresolved(number);
        }
      },
      error: () => this.markUnresolved(number),
    });
  }

  private openReceiptByNumber(number: string): void {
    this.payments.list({ search: number, schoolId: this.id(), pageIndex: 1, pageSize: 5 }).subscribe({
      next: (page) => {
        const receipt = page.items.find((r) => r.number === number);
        if (receipt) {
          void this.router.navigate(['/schools', this.id(), 'payments', receipt.id]);
        } else {
          this.markUnresolved(number);
        }
      },
      error: () => this.markUnresolved(number),
    });
  }

  private markUnresolved(number: string): void {
    this.unresolved.update((set) => new Set([...set, number]));
  }

  /** Finance R18: the filter of the statement on screen, so the PDF has exactly the rows that are shown. */
  private shownParams: LedgerStatementParams = {};
  readonly pdfBusy = signal(false);
  readonly pdfError = signal('');

  constructor() {
    effect(() => {
      this.id();
      this.party();
      untracked(() => {
        this.filters.reset({ kind: 'ALL', financialYear: '', session: '', from: '', to: '' });
        this.loadSessionChoice();
        this.load();
      });
    });
  }

  /** The sessions of a school: the one of today, the one before and after it, and any other a statement line has. */
  private loadSessionChoice(): void {
    this.sessionOptions.set([]);
    if (this.party() !== 'schools') {
      return;
    }

    this.sales.sessionChoice(this.id(), new Date().toISOString().slice(0, 10)).subscribe({
      next: (choice) => this.addSessions([choice.next, choice.session, choice.previous]),
      error: () => undefined,
    });
  }

  private addSessions(names: (string | null)[]): void {
    this.sessionOptions.update((list) => [...new Set([...list, ...names.filter((n): n is string => !!n)])].sort().reverse());
  }

  kindKey(kind: FilterKind): string {
    return { ALL: 'all', YEAR: 'year', SESSION: 'session', DATES: 'dates' }[kind];
  }

  /** "All entries" loads at once; the other choices show their inputs first. */
  kindChanged(): void {
    if (this.filters.controls.kind.value === 'ALL') {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    const params = this.params();
    this.ledger.statement(this.party(), this.id(), params).subscribe({
      next: (statement) => {
        this.loading.set(false);
        this.shownParams = params;
        this.statement.set(statement);
        this.addSessions(statement.rows.map((r) => r.session));
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.statement.set(null);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  /** Finance R18: downloads the statement on screen as a PDF named after the party. */
  downloadPdf(partyCode: string): void {
    this.pdfBusy.set(true);
    this.pdfError.set('');
    this.ledger.statementPdf(this.party(), this.id(), this.shownParams).subscribe({
      next: (blob) => {
        this.pdfBusy.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${partyCode}-ledger.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error: unknown) => {
        this.pdfBusy.set(false);
        this.pdfError.set(messageForError(error, this.translate));
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
