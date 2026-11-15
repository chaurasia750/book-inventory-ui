import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { InvoiceDetail } from '@org/shared-models';
import { ButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { SaleTotalsComponent } from './sale-totals';

/**
 * One invoice (sales spec R8-R13, the owner's document pattern): a header card with its number, status and money story (issued,
 * cancelled), the school and order, the lines with discounts and GST columns only when GST is applied, the totals, and the
 * Owner's Cancel with a reason. A cancelled invoice keeps its number and is struck through.
 */
@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, ModalComponent, SkeletonLoaderComponent, SaleTotalsComponent],
  template: `
    <div class="flex flex-col gap-3">
      @if (invoice(); as inv) {
        <a [routerLink]="['/schools', inv.school.id]" class="text-sm text-gray-500 hover:text-primary-fg">&larr; {{ inv.school.name }}</a>
        <section class="flex flex-col gap-3 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2.5">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 font-mono text-xl font-semibold text-primary-fg" [class.line-through]="inv.summary.status === 'CANCELLED'">{{ inv.summary.number }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="inv.summary.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">{{ 'sales.status.' + inv.summary.status | translate }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{{ inv.summary.invoiceDate | date: 'dd MMM yyyy' }}</span>
                <span>FY {{ inv.financialYear }}</span>
                <span>{{ 'sales.editor.session' | translate }} {{ inv.session }}</span>
                <a [routerLink]="['/school-orders', inv.summary.schoolOrderId]" class="font-mono text-primary-fg hover:underline">{{ inv.summary.orderNumber }}</a>
                <span>{{ inv.school.code }}</span>
                @if (inv.schoolGstin) { <span>GSTIN <span class="font-mono text-primary-fg">{{ inv.schoolGstin }}</span></span> }
              </div>
            </div>
            @if (isOwner && inv.summary.status === 'ISSUED') {
              <app-button size="sm" variant="secondary" (clicked)="cancelOpen.set(true)">{{ 'sales.invoices.cancel' | translate }}</app-button>
            }
          </div>
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
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.discount' | translate }}</th>
                  <th class="px-3 py-2 text-right font-semibold">{{ 'sales.totals.taxable' | translate }}</th>
                  @if (inv.isGstApplied) { <th class="px-3 py-2 text-right font-semibold">GST %</th><th class="px-3 py-2 text-right font-semibold">GST</th> }
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                @for (l of inv.lines; track l.id) {
                  <tr>
                    <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ l.item.name }}</span> <span class="font-mono text-gray-500">{{ l.item.code }}</span></td>
                    <td class="px-3 py-2 font-mono">{{ l.item.hsnCode || '-' }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ l.price.mrp | number: '1.2-2' }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ l.price.rate | number: '1.2-2' }}</td>
                    <td class="px-3 py-2 text-right">{{ l.quantity }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ (l.amounts.itemDiscount + l.amounts.totalDiscountShare) | number: '1.2-2' }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ l.amounts.taxable | number: '1.2-2' }}</td>
                    @if (inv.isGstApplied) {
                      <td class="px-3 py-2 text-right">{{ l.item.gstRatePercent }}</td>
                      <td class="px-3 py-2 text-right font-mono">{{ (l.amounts.cgst + l.amounts.sgst + l.amounts.igst) | number: '1.2-2' }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <aside class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <app-sale-totals [totals]="inv.totals" [gstMode]="inv.gstMode" />
          </aside>
        </div>

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
  private readonly translate = inject(TranslateService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly isOwner = inject(AuthService).hasAppRole('OWNER');
  readonly invoice = signal<InvoiceDetail | null>(null);
  readonly error = signal('');
  readonly cancelOpen = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });

  constructor() {
    this.load();
  }

  load(): void {
    this.sales.invoice(this.id).subscribe({ next: (i) => this.invoice.set(i), error: (e: unknown) => this.error.set(messageForError(e, this.translate)) });
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
