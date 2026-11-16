import { DatePipe, DecimalPipe, Location, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CompanyService, PaymentService, SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { InvoiceDetail, InvoiceGroupView, InvoiceLayout } from '@org/shared-models';
import { ButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { SaleTotalsComponent } from './sale-totals';
import { InvoiceReturnsComponent } from '../returns/invoice-returns';

/**
 * One invoice (sales spec R8-R13, R26, the owner's document pattern): a header card with its number, status and money story (issued,
 * cancelled), the school and order, the lines in the school's layout with a switch (book list: the same book merged; by class: one
 * group per class with its subtotal), GST columns only when GST is applied, the totals, and the Owner's Cancel with a reason. A
 * cancelled invoice keeps its number and is struck through. The layout never changes the invoice's numbers.
 */
@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, ModalComponent, SkeletonLoaderComponent, SaleTotalsComponent, InvoiceReturnsComponent],
  template: `
    <div class="flex flex-col gap-3">
      @if (invoice(); as inv) {
        <button type="button" (click)="back(inv.school.id)" class="self-start text-sm text-gray-500 hover:text-primary-fg">&larr; {{ 'sales.editor.back' | translate }}</button>
        <section class="flex flex-col gap-3 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2.5">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 font-mono text-xl font-semibold text-primary-fg" [class.line-through]="inv.summary.status === 'CANCELLED'">{{ inv.summary.number }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="inv.summary.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">{{ 'sales.status.' + inv.summary.status | translate }}</span>
              </div>
              <p class="mb-0 mt-1 text-xs font-semibold tracking-[0.1em] text-gray-600">{{ titleKey(inv) | translate }}@if (!inv.isGstApplied) { · {{ 'sales.invoice.gstExempted' | translate }} } · {{ 'school.paymentType.' + inv.paymentType | translate }}</p>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{{ inv.summary.invoiceDate | date: 'dd MMM yyyy' }}</span>
                <span>FY {{ inv.financialYear }}</span>
                <span>{{ 'sales.editor.session' | translate }} {{ inv.session }}</span>
                <a [routerLink]="['/school-orders', inv.summary.schoolOrderId]" class="font-mono text-primary-fg hover:underline">{{ inv.summary.orderNumber }}</a>
                <span>{{ inv.school.code }}</span>
                @if (inv.schoolGstin) { <span>GSTIN <span class="font-mono text-primary-fg">{{ inv.schoolGstin }}</span></span> }
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex rounded-lg border border-neutral-200 p-0.5 text-xs dark:border-charcoal-700" role="group" [attr.aria-label]="'sales.layout.label' | translate">
                @for (l of layouts; track l) {
                  <button type="button" (click)="switchTo(l)" class="rounded-md px-2.5 py-1 font-semibold" [ngClass]="inv.layout === l ? 'bg-primary-fg text-white' : 'text-gray-600 hover:text-primary-fg'">{{ 'sales.layout.' + l | translate }}</button>
                }
              </div>
              <app-button size="sm" variant="secondary" [loading]="busy()" (clicked)="print(inv)">{{ 'sales.invoice.print' | translate }}</app-button>
              <app-button size="sm" [loading]="busy()" (clicked)="download(inv)">{{ 'sales.invoice.downloadPdf' | translate }}</app-button>
              @if (isOwner && inv.summary.status === 'ISSUED') {
                <app-button size="sm" variant="secondary" (clicked)="cancelOpen.set(true)">{{ 'sales.invoices.cancel' | translate }}</app-button>
              }
            </div>
          </div>
          @if (paid(); as p) {
            <p class="m-0 text-xs text-gray-600">{{ 'payment.invoice.paid' | translate }}: <span class="font-mono">{{ p.allocated | number: '1.2-2' }}</span> · {{ 'payment.invoice.due' | translate }}: <span class="font-mono font-semibold">{{ p.due | number: '1.2-2' }}</span></p>
          }
          <ol class="flex flex-wrap gap-4 text-xs">
            <li class="flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-white">&#10003;</span>{{ 'sales.story.issued' | translate }} <span class="font-mono font-semibold">{{ inv.totals.grandTotal | number: '1.2-2' }}</span></li>
            <li class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full" [class]="inv.summary.status === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-neutral-200 text-gray-500'">2</span>
              {{ (inv.summary.status === 'CANCELLED' ? 'sales.story.cancelled' : 'sales.story.notCancelled') | translate }}
              @if (inv.cancelReason) { <span class="text-gray-500">({{ inv.cancelledOn | date: 'dd MMM yy' }}: {{ inv.cancelReason }})</span> }
            </li>
          </ol>
        </section>

        <div class="grid gap-3 lg:grid-cols-[1fr_300px]">
          <div class="overflow-x-auto rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
            <table class="w-full min-w-[720px] text-left text-xs" [class.line-through]="inv.summary.status === 'CANCELLED'">
              <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
                <tr>
                  <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                  <th class="px-3 py-2 font-semibold">HSN</th>
                  <th class="px-3 py-2 text-right font-semibold">MRP</th>
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.rate' | translate }}</th>
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                  @if (showDiscount()) { <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.discount' | translate }}</th> }
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.amount' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                @for (g of inv.groups; track g.className ?? '') {
                  @if (inv.layout === 'BY_CLASS') {
                    <tr class="bg-neutral-50/60 dark:bg-charcoal-900/40">
                      <td [attr.colspan]="showDiscount() ? 7 : 6" class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-fg">{{ g.className ?? ('sales.layout.general' | translate) }}</td>
                    </tr>
                  }
                  @for (l of g.lines; track l.id) {
                    <tr>
                      <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ l.item.name }}</span> <span class="font-mono text-gray-500">{{ l.item.code }}</span></td>
                      <td class="px-3 py-2 font-mono">{{ l.item.hsnCode || '-' }}</td>
                      <td class="px-3 py-2 text-right font-mono">{{ l.price.mrp | number: '1.2-2' }}</td>
                      <td class="px-3 py-2 text-right font-mono">{{ l.price.rate | number: '1.2-2' }}</td>
                      <td class="px-3 py-2 text-right">{{ l.quantity }}</td>
                      @if (showDiscount()) { <td class="px-3 py-2 text-right font-mono">{{ l.amounts.itemDiscount | number: '1.2-2' }}</td> }
                      <td class="px-3 py-2 text-right font-mono">{{ l.amounts.lineAmount | number: '1.2-2' }}</td>
                    </tr>
                  }
                  @if (inv.layout === 'BY_CLASS') {
                    <tr>
                      <td [attr.colspan]="showDiscount() ? 6 : 5" class="px-3 py-1.5 text-right text-[11px] font-semibold text-gray-500">{{ 'sales.layout.subtotal' | translate }}</td>
                      <td class="px-3 py-1.5 text-right font-mono font-semibold">{{ groupAmount(g) | number: '1.2-2' }}</td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          <aside class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <app-sale-totals [totals]="inv.totals" [gstMode]="inv.gstMode" />
          </aside>
        </div>

        <app-invoice-returns [invoiceId]="inv.summary.id" />

        @if (inv.gstSummary.length) {
          <section class="overflow-x-auto rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800" [attr.aria-label]="'sales.invoice.gstSummary' | translate">
            <table class="w-full min-w-[520px] text-left text-xs">
              <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
                <tr>
                  <th class="px-3 py-2 font-semibold">HSN</th>
                  <th class="px-3 py-2 font-semibold">{{ 'sales.invoice.gstRate' | translate }}</th>
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.totals.taxable' | translate }}</th>
                  @if (inv.gstMode === 'SAME_STATE') {
                    <th class="px-3 py-2 text-right font-semibold">CGST</th><th class="px-3 py-2 text-right font-semibold">SGST</th>
                  } @else {
                    <th class="px-3 py-2 text-right font-semibold">IGST</th>
                  }
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.invoice.totalGst' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                @for (r of inv.gstSummary; track r.hsnCode + '|' + r.ratePercent) {
                  <tr>
                    <td class="px-3 py-2 font-mono">{{ r.hsnCode || '-' }}</td>
                    <td class="px-3 py-2">{{ r.ratePercent }} %</td>
                    <td class="px-3 py-2 text-right font-mono">{{ r.taxable | number: '1.2-2' }}</td>
                    @if (inv.gstMode === 'SAME_STATE') {
                      <td class="px-3 py-2 text-right font-mono">{{ r.cgst | number: '1.2-2' }}</td><td class="px-3 py-2 text-right font-mono">{{ r.sgst | number: '1.2-2' }}</td>
                    } @else {
                      <td class="px-3 py-2 text-right font-mono">{{ r.igst | number: '1.2-2' }}</td>
                    }
                    <td class="px-3 py-2 text-right font-mono">{{ r.tax | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }
        <p class="m-0 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <span class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'sales.invoice.amountInWords' | translate }}</span><br>
          <b>{{ inv.amountInWords }}</b>
        </p>
        @if (actionError()) { <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">{{ actionError() }}</p> }

        <app-modal [open]="cancelOpen()" [title]="'sales.invoices.cancelTitle' | translate" (closed)="cancelOpen.set(false)">
          <div class="space-y-3">
            <p class="text-sm text-gray-600">{{ 'sales.invoices.cancelHint' | translate }}</p>
            <label for="iv-reason" class="block text-sm font-semibold">{{ 'sales.editor.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <textarea id="iv-reason" rows="3" [formControl]="reason" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
            @if (cancelError()) { <p class="text-xs text-red-600" role="alert">{{ cancelError() }}</p> }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="cancelOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button variant="danger" (clicked)="cancel()">{{ 'sales.invoices.cancel' | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">{{ error() }}</p>
      } @else {
        <div class="space-y-2 rounded-[10px] border border-neutral-200 bg-white p-4"><app-skeleton-loader width="40%" /><app-skeleton-loader width="100%" /></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceViewComponent {
  private readonly sales = inject(SalesService);
  private readonly companies = inject(CompanyService);
  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly isOwner = inject(AuthService).hasAppRole('OWNER');
  readonly layouts: InvoiceLayout[] = ['BOOK_LIST', 'BY_CLASS'];
  readonly invoice = signal<InvoiceDetail | null>(null);
  /** Payment R16: what receipts applied to this invoice and what is still due (the Owner's; null until read). */
  readonly paid = signal<{ allocated: number; due: number } | null>(null);
  /** Sales R36: the company's item-wise discount setting (company R23). */
  readonly usesItemDiscount = signal(false);
  /** The Discount column shows when the setting is on or a line of this invoice has a discount. */
  readonly showDiscount = computed(() => this.usesItemDiscount() || (this.invoice()?.lines ?? []).some((l) => l.amounts.itemDiscount > 0));
  readonly error = signal('');
  readonly cancelOpen = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });
  readonly busy = signal(false);
  readonly actionError = signal('');

  /** R26: the layout chosen on this screen; empty opens in the school's default. */
  private layout: InvoiceLayout | undefined;

  constructor() {
    this.companies.invoiceIdentity().subscribe({ next: (i) => this.usesItemDiscount.set(i.invoice.usesItemDiscount), error: () => this.usesItemDiscount.set(false) });
    this.load();
  }

  /** Back to where the invoice was opened from (the invoice list, the order or the school's tab); the school when there is no history. */
  back(schoolId: string): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/schools', schoolId]);
    }
  }

  load(): void {
    this.sales.invoice(this.id, this.layout).subscribe({ next: (i) => { this.invoice.set(i); this.loadPaid(i.summary.status); }, error: (e: unknown) => this.error.set(messageForError(e, this.translate)) });
  }

  private loadPaid(status: string): void {
    if (!this.isOwner || status !== 'ISSUED') {
      this.paid.set(null);
      return;
    }
    this.payments.invoiceDues([this.id]).subscribe({ next: (d) => this.paid.set(d[0] ? { allocated: d[0].allocated, due: d[0].due } : null), error: () => this.paid.set(null) });
  }

  /** R31: the title of the document (the same rule as the PDF): TAX INVOICE with GST; without it CASH MEMO or CREDIT MEMO. */
  titleKey(inv: InvoiceDetail): string {
    return 'sales.invoice.title.' + (inv.isGstApplied ? 'TAX_INVOICE' : inv.paymentType === 'CASH' ? 'CASH_MEMO' : 'CREDIT_MEMO');
  }

  /** R32: a class group's amount is the sum of its lines' amounts (the column the lines show). */
  groupAmount(group: InvoiceGroupView): number {
    return group.lines.reduce((sum, l) => sum + l.amounts.lineAmount, 0);
  }

  /** R33: the PDF in the layout on screen, saved as a file named after the invoice. */
  download(inv: InvoiceDetail): void {
    this.withPdf(inv, (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = inv.summary.number.split('/').join('-') + '.pdf';
      link.click();
    });
  }

  /** R33: the PDF opens in a new tab for the browser's print dialog; the tab is opened first so a pop-up blocker allows it. */
  print(inv: InvoiceDetail): void {
    const tab = window.open('', '_blank');
    this.withPdf(inv, (url) => {
      if (tab) {
        tab.location.href = url;
      }
    }, () => tab?.close());
  }

  private withPdf(inv: InvoiceDetail, use: (objectUrl: string) => void, onError?: () => void): void {
    this.busy.set(true);
    this.actionError.set('');
    this.sales.invoicePdf(this.id, inv.layout).subscribe({
      next: (blob) => {
        this.busy.set(false);
        const url = URL.createObjectURL(blob);
        use(url);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.actionError.set(messageForError(e, this.translate));
        onError?.();
      },
    });
  }

  switchTo(layout: InvoiceLayout): void {
    this.layout = layout;
    this.load();
  }

  cancel(): void {
    this.cancelError.set('');
    this.sales.cancelInvoice(this.id, this.reason.value).subscribe({
      next: () => {
        this.cancelOpen.set(false);
        this.load();
      },
      error: (e: unknown) => this.cancelError.set(messageForError(e, this.translate)),
    });
  }
}
