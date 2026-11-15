import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  MAX_RECEIPT_MODES,
  MAX_RECEIPT_PROOFS,
  PAYMENT_MODE_TYPES,
  PaymentModeType,
  ReceiptDetail,
  ReceiptModeRequest,
  RecordReceiptRequest,
  SchoolDues,
  proofFileError,
} from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, ModalComponent } from '@org/ui';

interface ModeRow {
  type: PaymentModeType;
  amount: string;
  reference: string;
  chequeNumber: string;
  chequeDate: string;
  bankName: string;
}

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

const blankMode = (): ModeRow => ({ type: 'CASH', amount: '', reference: '', chequeNumber: '', chequeDate: '', bankName: '' });
const money = (value: number): number => Math.round(value * 100) / 100;

/**
 * The "Receive payment" dialog of a school (payment spec R3-R9): the school's balance and open invoices first, then the modes (a
 * mix is one receipt), the date and a remark. The payment is applied oldest invoice first (the preview here only repeats what the
 * server does) or by hand; the part applied to no invoice is the advance. The same client request id is sent on every attempt of
 * one dialog, so a retry never records the payment twice (R9).
 */
@Component({
  selector: 'app-receive-payment-dialog',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal size="wide" [open]="open()" [title]="'payment.receive.title' | translate" (closed)="close()">
      @if (recorded(); as done) {
        <div class="space-y-4 text-sm" role="status">
          <p class="m-0 font-semibold text-primary-fg">{{ 'payment.receive.done' | translate: { number: done.summary.number } }}</p>
          <p class="m-0 text-gray-600">
            {{ 'payment.detail.total' | translate }}: <span class="font-mono">{{ done.summary.totalAmount | number: '1.2-2' }}</span>
            · {{ 'payment.detail.advance' | translate }}: <span class="font-mono">{{ done.advanceAmount | number: '1.2-2' }}</span>
          </p>
          @if (proofFailures().length > 0) {
            <div class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700" role="alert">
              <p class="m-0 font-semibold">{{ 'payment.proof.failed' | translate }}</p>
              @for (f of proofFailures(); track f) { <p class="m-0">{{ f }}</p> }
            </div>
          }
          <div class="flex justify-end"><app-button (clicked)="close()">{{ 'payment.receive.close' | translate }}</app-button></div>
        </div>
      } @else if (loading()) {
        <p class="m-0 py-6 text-center text-sm text-gray-500">{{ 'payment.receive.loading' | translate }}</p>
      } @else if (loadError()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span><app-button size="sm" variant="secondary" (clicked)="loadDues()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (dues(); as d) {
        <div class="space-y-4">
          <div class="rounded-lg border border-neutral-200 p-3 dark:border-charcoal-700">
            <p class="m-0 text-sm">
              {{ 'payment.receive.balance' | translate }}:
              <span class="font-mono font-semibold" [class.text-green-700]="d.balance < 0">{{ d.balance | number: '1.2-2' }}</span>
              @if (d.balance < 0) { <span class="text-xs text-gray-500">({{ 'payment.receive.advanceHint' | translate }})</span> }
            </p>
            @if (d.openInvoices.length === 0) {
              <p class="m-0 mt-1 text-xs text-gray-500">{{ 'payment.receive.noOpen' | translate }}</p>
            } @else {
              <div class="mt-2 max-h-48 overflow-auto">
                <table class="w-full text-left text-xs">
                  <thead class="text-[11px] uppercase tracking-[0.05em] text-gray-500">
                    <tr>
                      <th class="py-1 pr-3 font-semibold">{{ 'sales.columns.number' | translate }}</th>
                      <th class="py-1 pr-3 text-right font-semibold">{{ 'sales.columns.total' | translate }}</th>
                      <th class="py-1 pr-3 text-right font-semibold">{{ 'payment.receive.due' | translate }}</th>
                      <th class="py-1 text-right font-semibold">{{ 'payment.receive.applied' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (o of d.openInvoices; track o.invoiceId) {
                      <tr>
                        <td class="py-1 pr-3 font-mono">{{ o.number }}</td>
                        <td class="py-1 pr-3 text-right font-mono">{{ o.grandTotal | number: '1.2-2' }}</td>
                        <td class="py-1 pr-3 text-right font-mono">{{ o.due | number: '1.2-2' }}</td>
                        <td class="py-1 text-right">
                          @if (manual()) {
                            <input type="number" min="0" step="0.01" [value]="manualAmounts()[o.invoiceId] ?? ''" (input)="setManual(o.invoiceId, $any($event.target).value)"
                              [attr.aria-label]="o.number" class="h-8 w-28 rounded border border-gray-300 px-2 text-right text-xs" />
                          } @else {
                            <span class="font-mono">{{ preview()[o.invoiceId] ?? 0 | number: '1.2-2' }}</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <label class="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" class="h-4 w-4" [checked]="manual()" (change)="manual.set($any($event.target).checked)" />
                {{ 'payment.receive.byHand' | translate }}
              </label>
            }
          </div>

          <div class="space-y-2">
            <p class="m-0 text-sm font-semibold">{{ 'payment.receive.modes' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></p>
            @for (m of modes(); track $index; let i = $index) {
              <div class="grid items-end gap-2 rounded-lg border border-neutral-200 p-2 sm:grid-cols-[9rem_8rem_1fr_auto] dark:border-charcoal-700">
                <div>
                  <label [for]="'pm-type-' + i" [class]="label">{{ 'payment.receive.mode' | translate }}</label>
                  <select [id]="'pm-type-' + i" [class]="field" (change)="setMode(i, { type: $any($event.target).value })">
                    @for (t of modeTypes; track t) { <option [value]="t" [selected]="t === m.type">{{ 'payment.mode.' + t | translate }}</option> }
                  </select>
                </div>
                <div>
                  <label [for]="'pm-amount-' + i" [class]="label">{{ 'payment.receive.amount' | translate }}</label>
                  <input [id]="'pm-amount-' + i" type="number" min="0" step="0.01" [value]="m.amount" (input)="setMode(i, { amount: $any($event.target).value })" [class]="field + ' text-right'" />
                </div>
                <div [class]="m.type === 'CHEQUE' ? 'grid gap-2 sm:grid-cols-3' : 'grid gap-2'">
                  @if (m.type === 'UPI' || m.type === 'BANK_TRANSFER') {
                    <div>
                      <label [for]="'pm-ref-' + i" [class]="label">{{ (m.type === 'UPI' ? 'payment.receive.upiId' : 'payment.receive.utr') | translate }}</label>
                      <input [id]="'pm-ref-' + i" [value]="m.reference" (input)="setMode(i, { reference: $any($event.target).value })" maxlength="50" [class]="field" />
                    </div>
                  }
                  @if (m.type === 'CHEQUE') {
                    <div>
                      <label [for]="'pm-cno-' + i" [class]="label">{{ 'payment.receive.chequeNumber' | translate }}</label>
                      <input [id]="'pm-cno-' + i" [value]="m.chequeNumber" (input)="setMode(i, { chequeNumber: $any($event.target).value })" maxlength="20" [class]="field" />
                    </div>
                    <div>
                      <label [for]="'pm-cdate-' + i" [class]="label">{{ 'payment.receive.chequeDate' | translate }}</label>
                      <input [id]="'pm-cdate-' + i" type="date" [value]="m.chequeDate" (input)="setMode(i, { chequeDate: $any($event.target).value })" [class]="field" />
                    </div>
                    <div>
                      <label [for]="'pm-bank-' + i" [class]="label">{{ 'payment.receive.bankName' | translate }}</label>
                      <input [id]="'pm-bank-' + i" [value]="m.bankName" (input)="setMode(i, { bankName: $any($event.target).value })" maxlength="100" [class]="field" />
                    </div>
                  }
                </div>
                @if (modes().length > 1) {
                  <app-button size="sm" variant="ghost" (clicked)="removeMode(i)" [attr.aria-label]="'payment.receive.removeMode' | translate">&times;</app-button>
                }
              </div>
            }
            @if (modes().length < maxModes) {
              <app-button size="sm" variant="secondary" (clicked)="addMode()">{{ 'payment.receive.addMode' | translate }}</app-button>
            }
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="pm-date" [class]="label">{{ 'payment.receive.date' | translate }}</label>
              <app-date-picker inputId="pm-date" [formControl]="date" />
            </div>
            <div>
              <label for="pm-remark" [class]="label">{{ 'payment.receive.remark' | translate }}</label>
              <input id="pm-remark" [formControl]="remark" maxlength="500" [class]="field" />
            </div>
          </div>

          <div>
            <label for="pm-proof" [class]="label">{{ 'payment.proof.optional' | translate }}</label>
            <input id="pm-proof" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" (change)="chooseProofs($any($event.target))"
              class="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm" />
            @if (proofError()) { <p class="m-0 mt-1 text-xs text-red-600" role="alert">{{ proofError() }}</p> }
            @else if (proofFiles().length > 0) { <p class="m-0 mt-1 text-xs text-gray-500">{{ proofNames() }}</p> }
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3 text-sm dark:border-charcoal-700">
            <div class="flex flex-wrap gap-x-5 gap-y-1">
              <span>{{ 'payment.detail.total' | translate }}: <span class="font-mono font-semibold">{{ total() | number: '1.2-2' }}</span></span>
              <span>{{ 'payment.receive.applied' | translate }}: <span class="font-mono">{{ applied() | number: '1.2-2' }}</span></span>
              <span>{{ 'payment.detail.advance' | translate }}: <span class="font-mono" [class.text-red-600]="advance() < 0">{{ advance() | number: '1.2-2' }}</span></span>
            </div>
            <div class="flex gap-2">
              <app-button variant="secondary" (clicked)="close()">{{ 'users.cancel' | translate }}</app-button>
              <app-button [loading]="saving()" [disabled]="total() <= 0 || advance() < 0" (clicked)="submit()">{{ 'payment.receive.submit' | translate }}</app-button>
            </div>
          </div>
          @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        </div>
      }
    </app-modal>
  `,
})
export class ReceivePaymentDialogComponent {
  readonly open = input(false);
  readonly schoolId = input.required<string>();
  readonly closed = output<void>();
  /** A receipt was recorded: the school's list and balance reload. */
  readonly recordedReceipt = output<ReceiptDetail>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly field = FIELD;
  readonly label = LABEL;
  readonly modeTypes = PAYMENT_MODE_TYPES;
  readonly maxModes = MAX_RECEIPT_MODES;

  readonly dues = signal<SchoolDues | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly modes = signal<ModeRow[]>([blankMode()]);
  readonly manual = signal(false);
  readonly manualAmounts = signal<Partial<Record<string, string>>>({});
  readonly recorded = signal<ReceiptDetail | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly date = new FormControl('', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });
  /** Payment R20: the optional proof files; they are uploaded after the receipt is recorded. */
  readonly proofFiles = signal<File[]>([]);
  readonly proofError = signal('');
  readonly proofFailures = signal<string[]>([]);
  readonly proofNames = computed(() => this.proofFiles().map((f) => f.name).join(', '));

  private clientRequestId = crypto.randomUUID();

  readonly total = computed(() => money(this.modes().reduce((sum, m) => sum + (Number(m.amount) || 0), 0)));

  /** R6: the oldest-first plan the server will make (a preview; the server decides). */
  readonly preview = computed<Partial<Record<string, number>>>(() => {
    const plan: Partial<Record<string, number>> = {};
    let left = this.total();
    for (const o of this.dues()?.openInvoices ?? []) {
      const take = money(Math.min(left, o.due));
      if (take > 0) {
        plan[o.invoiceId] = take;
        left = money(left - take);
      }
    }
    return plan;
  });

  readonly applied = computed(() =>
    this.manual() ? money(Object.values(this.manualAmounts()).reduce<number>((sum, v) => sum + (Number(v) || 0), 0)) : money(Object.values(this.preview()).reduce<number>((sum, v) => sum + (Number(v) || 0), 0)),
  );
  readonly advance = computed(() => money(this.total() - this.applied()));

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => this.start());
      }
    });
  }

  start(): void {
    this.clientRequestId = crypto.randomUUID();
    this.modes.set([blankMode()]);
    this.manual.set(false);
    this.manualAmounts.set({});
    this.recorded.set(null);
    this.error.set('');
    this.date.reset('');
    this.remark.reset('');
    this.proofFiles.set([]);
    this.proofError.set('');
    this.proofFailures.set([]);
    this.loadDues();
  }

  loadDues(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.payments.dues(this.schoolId()).subscribe({
      next: (dues) => {
        this.dues.set(dues);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(e, this.translate));
      },
    });
  }

  setMode(index: number, patch: Partial<ModeRow>): void {
    this.modes.update((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  addMode(): void {
    this.modes.update((rows) => [...rows, blankMode()]);
  }

  removeMode(index: number): void {
    this.modes.update((rows) => rows.filter((_, i) => i !== index));
  }

  setManual(invoiceId: string, value: string): void {
    this.manualAmounts.update((m) => ({ ...m, [invoiceId]: value }));
  }

  submit(): void {
    this.error.set('');
    this.saving.set(true);
    this.payments.record(this.requestOf()).subscribe({
      next: (receipt) => this.uploadProofs(receipt),
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  /** R20: checks the chosen proof files (type, size, at most five) before anything is sent. */
  chooseProofs(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    this.proofError.set('');
    const problem = files.length > MAX_RECEIPT_PROOFS ? 'tooMany' : files.map((f) => proofFileError(f)).find((p) => p !== null);
    if (problem) {
      this.proofError.set(this.translate.instant(`payment.proof.${problem}`));
      this.proofFiles.set([]);
      input.value = '';
      return;
    }
    this.proofFiles.set(files);
  }

  /** R20: after the receipt is recorded the proofs go one by one; a failed one is listed, the receipt stays recorded. */
  private uploadProofs(receipt: ReceiptDetail): void {
    from(this.proofFiles())
      .pipe(
        concatMap((file) =>
          this.payments.uploadProof(receipt.summary.id, file).pipe(
            map(() => null),
            catchError((e: unknown) => of(`${file.name}: ${messageForError(e, this.translate)}`)),
          ),
        ),
        toArray(),
      )
      .subscribe((results) => {
        this.proofFailures.set(results.filter((r): r is string => r !== null));
        this.saving.set(false);
        this.recorded.set(receipt);
        this.recordedReceipt.emit(receipt);
      });
  }

  close(): void {
    this.closed.emit();
  }

  private requestOf(): RecordReceiptRequest {
    const allocations = this.manual()
      ? Object.entries(this.manualAmounts())
          .map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) }))
          .filter((a) => a.amount > 0)
      : undefined;
    return {
      clientRequestId: this.clientRequestId,
      schoolId: this.schoolId(),
      receiptDate: this.date.value || undefined,
      modes: this.modes().map((m) => this.modeOf(m)),
      allocations,
      remark: this.remark.value.trim() || undefined,
    };
  }

  private modeOf(m: ModeRow): ReceiptModeRequest {
    const mode: ReceiptModeRequest = { type: m.type, amount: Number(m.amount) };
    if (m.type === 'UPI' || m.type === 'BANK_TRANSFER') {
      mode.reference = m.reference.trim();
    }
    if (m.type === 'CHEQUE') {
      mode.chequeNumber = m.chequeNumber.trim();
      mode.chequeDate = m.chequeDate || undefined;
      mode.bankName = m.bankName.trim();
    }
    return mode;
  }
}
