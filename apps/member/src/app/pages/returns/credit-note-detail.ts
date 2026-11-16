import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { ReturnService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CreditNote, Refund, SaleTotals } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { SaleTotalsComponent } from '../sales/sale-totals';
import { PdfHandlers, downloadPdf, printPdf } from './pdf-delivery';
import { IndianCurrencyPipe } from '../counters/indian-currency.pipe';
import { MoneyPipe } from '../counters/money.pipe';

/**
 * One credit note in the panel beside the returns list (sales spec R57, R58, R61): its number, date, school, invoice, reason, the
 * lines with their condition (Good or Damaged), the totals (the server's own), the refunds that name it and, after saving, a
 * yellow warning for a line returned beyond what was sold (R54). The Owner cancels it with a reason; Staff only read (R60).
 */
@Component({
  selector: 'app-credit-note-detail',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, SaleTotalsComponent, MoneyPipe, IndianCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (loading()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="space-y-3 rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800"><app-skeleton-loader width="14rem" /><app-skeleton-loader width="100%" /></div>
      } @else if (loadError()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span><app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (note(); as n) {
        <section class="flex flex-col gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 font-mono text-lg font-semibold text-primary-fg" [class.line-through]="n.status === 'CANCELLED'">{{ n.number }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(n.status)">{{ 'returns.status.' + n.status | translate }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span class="font-mono">{{ n.noteDate }}</span>
                <span>{{ n.schoolName }} <span class="font-mono">({{ n.schoolCode }})</span></span>
                <span>{{ 'returns.fields.invoice' | translate }}: <span class="font-mono">{{ n.invoiceNumber || '-' }}</span></span>
                <span>{{ 'returns.fields.reason' | translate }}: {{ 'returns.reason.' + n.reason | translate }}</span>
              </div>
            </div>
            <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
          </div>
          @if (n.remark) { <p class="m-0 text-xs text-gray-600">{{ n.remark }}</p> }
          @if (overReturned()) {
            <p class="m-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="status">{{ 'returns.detail.overWarning' | translate }}</p>
          }
          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="secondary" [loading]="busy()" (clicked)="print(n)">{{ 'returns.detail.print' | translate }}</app-button>
            <app-button size="sm" [loading]="busy()" (clicked)="download(n)">{{ 'returns.detail.downloadPdf' | translate }}</app-button>
            @if (isOwner && n.status === 'ACTIVE') { <app-button size="sm" variant="secondary" (clicked)="openCancel()">{{ 'returns.detail.cancel' | translate }}</app-button> }
          </div>
          @if (actionError()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ actionError() }}</p> }
          @if (n.status === 'CANCELLED' && n.cancelReason) {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="status">{{ 'returns.detail.cancelled' | translate }}: {{ n.cancelReason }}@if (n.cancelledOn) { <span class="text-gray-500"> ({{ n.cancelledOn }})</span> }</p>
          }
        </section>

        <section class="overflow-x-auto rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
          <table class="w-full min-w-[520px] text-left text-xs" [class.line-through]="n.status === 'CANCELLED'">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'returns.lines.condition' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.rate' | translate }} (₹)</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.amount' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @for (line of n.lines; track $index) {
                <tr>
                  <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ line.itemName }}</span> <span class="ml-1 font-mono text-gray-500">{{ line.itemCode }}</span></td>
                  <td class="px-3 py-2">{{ 'returns.condition.' + line.condition | translate }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.rateAmount | inr }}</td>
                  <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.lineAmount | inr }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <div class="grid gap-3 sm:grid-cols-2">
          <aside class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800"><app-sale-totals [totals]="totals()" [gstMode]="gstMode()" /></aside>
          <section class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'returns.detail.refunds' | translate }}</h2>
            @for (r of refunds(); track r.id) {
              <p class="m-0 flex justify-between text-sm"><span class="font-mono text-xs">{{ r.number }} · {{ r.refundDate }}</span><span class="font-mono" [class.line-through]="r.status === 'CANCELLED'">{{ r.amount | money }}</span></p>
            } @empty { <p class="m-0 text-xs text-gray-500">{{ 'returns.detail.noRefunds' | translate }}</p> }
          </section>
        </div>

        <app-modal [open]="cancelOpen()" [title]="'returns.detail.cancelTitle' | translate" (closed)="cancelOpen.set(false)">
          <div class="space-y-3">
            <p class="text-sm text-gray-600">{{ 'returns.detail.cancelHint' | translate }}</p>
            <label for="cnd-reason" class="block text-sm font-semibold">{{ 'sales.editor.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <textarea id="cnd-reason" rows="3" [formControl]="reason" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
            @if (cancelError()) { <p class="text-xs text-red-600" role="alert">{{ cancelError() }}</p> }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="cancelOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button variant="danger" [loading]="cancelling()" [disabled]="reason.value.trim().length < 5" (clicked)="cancel()">{{ 'returns.detail.cancel' | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class CreditNoteDetailComponent {
  readonly id = input.required<string>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly returns = inject(ReturnService);
  private readonly translate = inject(TranslateService);

  /** R60: only the Owner cancels a credit note. */
  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  readonly note = signal<CreditNote | null>(null);
  readonly refunds = signal<Refund[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly busy = signal(false);
  readonly actionError = signal('');
  readonly cancelOpen = signal(false);
  readonly cancelling = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });

  /** R54: the list page passes the over-return warning of the credit note it has just made through the navigation state. */
  readonly overReturned = signal(false);

  readonly totals = computed<SaleTotals | null>(() => {
    const n = this.note();
    return n
      ? { subtotal: n.subtotal, totalDiscount: n.totalDiscount, taxable: n.taxable, cgst: n.cgst, sgst: n.sgst, igst: n.igst, roundOff: n.roundOff, grandTotal: n.grandTotal, gst: n.cgst + n.sgst + n.igst, beforeRounding: n.taxable + n.cgst + n.sgst + n.igst }
      : null;
  });

  readonly gstMode = computed(() => {
    const n = this.note();
    if (!n || !n.isGstApplied) return 'NOT_APPLIED' as const;
    return n.igst > 0 ? ('OTHER_STATE' as const) : ('SAME_STATE' as const);
  });

  statusClass = counterBillStatusBadgeClass;

  private readonly pdfHandlers: PdfHandlers = { busy: (v) => this.busy.set(v), failed: (e) => this.actionError.set(messageForError(e, this.translate)) };

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.returns.creditNote(this.id()).subscribe({
      next: (note) => {
        this.loading.set(false);
        this.note.set(note);
        this.overReturned.set(history.state?.overReturnedId === note.id);
        this.returns.refunds({ creditNoteId: note.id, pageIndex: 1, pageSize: 50 }).subscribe({ next: (p) => this.refunds.set(p.items), error: () => this.refunds.set([]) });
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(e, this.translate));
      },
    });
  }

  /** R71: the credit note opens in a new tab for the browser's print dialog. */
  print(n: CreditNote): void {
    this.actionError.set('');
    printPdf(this.returns.creditNotePdf(n.id), this.pdfHandlers);
  }

  /** R71: the credit note is saved as a file named after its number. */
  download(n: CreditNote): void {
    this.actionError.set('');
    downloadPdf(this.returns.creditNotePdf(n.id), n.number, this.pdfHandlers);
  }

  openCancel(): void {
    this.reason.setValue('');
    this.cancelError.set('');
    this.cancelOpen.set(true);
  }

  cancel(): void {
    if (this.reason.value.trim().length < 5) return;
    this.cancelling.set(true);
    this.cancelError.set('');
    this.returns.cancelCreditNote(this.id(), this.reason.value.trim()).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (e: unknown) => {
        this.cancelling.set(false);
        this.cancelError.set(messageForError(e, this.translate));
      },
    });
  }
}
