import { DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '@org/auth';
import { CompanyService, PriceService, SalesService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AddLinesResponse, DiscountKind, ItemSummary, PAYMENT_TYPES, PaymentType, PriceVersion, SaveSchoolOrderRequest, SchoolOrderDetail, SessionChoice } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { BulkItemPickerComponent, BulkPick } from './bulk-item-picker';
import { ClassSetDialogComponent } from './class-set-dialog';
import { ItemEntryComponent } from './item-entry';
import { MakeInvoiceComponent } from './make-invoice';
import { SaleTotalsComponent } from './sale-totals';

/** One editable line; `lineId` and `invoiced` come from the server on a saved order (R20). */
interface EditLine {
  lineId?: string;
  itemId: string;
  code: string;
  name: string;
  versions: PriceVersion[];
  versionId: string;
  quantity: number;
  discKind: DiscountKind;
  discValue: number;
  className: string | null;
  invoiced: number;
}

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

/**
 * The full-width order page (sales spec R2-R7, R14, R20-R25, R27). A new order needs only the school: date today, session and GST
 * from the school; books are added by scan or search, as whole class sets or in bulk, each line with its class. A draft changes
 * freely; a confirmed order still changes above what is invoiced (locked cells are shown read-only). Every amount is the server's.
 */
@Component({
  selector: 'app-order-editor',
  standalone: true,
  imports: [
    DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, DatePickerComponent, ModalComponent, SkeletonLoaderComponent,
    ItemEntryComponent, MakeInvoiceComponent, SaleTotalsComponent, BulkItemPickerComponent, ClassSetDialogComponent,
  ],
  templateUrl: './order-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderEditorComponent {
  private readonly sales = inject(SalesService);
  private readonly schools = inject(SchoolService);
  private readonly prices = inject(PriceService);
  private readonly companies = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  /** Back to where the order was opened from (the order list or the school's tab); the school's profile when there is no history. */
  back(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/schools', this.schoolId()]);
    }
  }
  readonly field = FIELD;
  readonly discountKinds: DiscountKind[] = ['NONE', 'PERCENT', 'AMOUNT'];
  readonly paymentTypes = PAYMENT_TYPES;

  readonly order = signal<SchoolOrderDetail | null>(null);
  readonly schoolId = signal('');
  readonly schoolName = signal('');
  readonly classes = signal<string[]>([]);
  readonly lines = signal<EditLine[]>([]);
  readonly choice = signal<SessionChoice | null>(null);
  readonly session = signal('');
  readonly isGst = signal(false);
  readonly paymentType = signal<PaymentType>('CREDIT');
  readonly totalKind = signal<DiscountKind>('NONE');
  readonly totalValue = signal(0);
  readonly orderDate = new FormControl('', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly dirty = signal(false);
  readonly closeOpen = signal(false);
  readonly closeReason = new FormControl('', { nonNullable: true });
  readonly invoiceOpen = signal(false);
  readonly bulkOpen = signal(false);
  readonly setsOpen = signal(false);

  readonly status = computed(() => this.order()?.status ?? 'DRAFT');
  readonly isDraft = computed(() => this.status() === 'DRAFT');
  /** R20: lines change on a draft and on a confirmed order. */
  /** Sales R36: the company's item-wise discount setting (company R23); the Discount column and its inputs are there only when it is on or a line already has a discount. */
  readonly usesItemDiscount = signal(false);
  readonly showDiscount = computed(() => this.usesItemDiscount() || this.lines().some((l) => l.discKind !== 'NONE'));
  readonly editable = computed(() => this.status() === 'DRAFT' || this.status() === 'CONFIRMED');
  readonly anyInvoiced = computed(() => this.lines().some((l) => l.invoiced > 0));
  /** R20: the total discount and the GST choice are fixed once something is invoiced. */
  readonly totalsEditable = computed(() => this.editable() && !this.anyInvoiced());
  readonly sessions = computed(() => {
    const c = this.choice();
    return c ? [c.previous, c.session, c.next] : this.session() ? [this.session()] : [];
  });

  constructor() {
    this.companies.invoiceIdentity().subscribe({ next: (i) => this.usesItemDiscount.set(i.invoice.usesItemDiscount), error: () => this.usesItemDiscount.set(false) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadOrder(id);
    } else {
      this.startNew(this.route.snapshot.queryParamMap.get('schoolId') ?? '');
    }
  }

  /** R27: a new order needs only the school; the date is today and the session and GST follow the school. */
  private startNew(schoolId: string): void {
    this.schoolId.set(schoolId);
    this.orderDate.setValue(new Date().toISOString().slice(0, 10));
    this.loadSchool(schoolId, (gst, payment) => {
      this.isGst.set(gst);
      this.paymentType.set(payment);
      this.loading.set(false);
      this.loadChoice(true);
    });
  }

  /**
   * The school's classes and defaults. A new order needs the school (a failure stops the page); an order that exists already carries
   * its school's name and code, so a school the caller can no longer read (a deactivated school, which Staff do not see) only leaves
   * the class choice empty and the order opens all the same.
   */
  private loadSchool(schoolId: string, then: (isGstDefault: boolean, paymentType: PaymentType) => void, required = true): void {
    this.schools.get(schoolId).subscribe({
      next: (s) => {
        this.schoolName.set(s.name);
        this.classes.set(s.classes.map((c) => c.name));
        then(s.isGstDefault, s.paymentType);
      },
      error: (e: unknown) => {
        if (required) {
          this.fail(e);
        }
      },
    });
  }

  private loadOrder(id: string): void {
    this.loading.set(true);
    this.sales.order(id).subscribe({
      next: (o) => this.fill(o),
      error: (e: unknown) => this.fail(e),
    });
  }

  private fill(o: SchoolOrderDetail): void {
    this.order.set(o);
    this.schoolId.set(o.school.id);
    this.schoolName.set(o.school.name);
    this.orderDate.setValue(o.orderDate);
    this.remark.setValue(o.remark ?? '');
    this.session.set(o.session);
    this.isGst.set(o.isGstApplied);
    this.paymentType.set(o.paymentType);
    this.totalKind.set(o.totalDiscount.kind);
    this.totalValue.set(o.totalDiscount.value);
    if (this.classes().length === 0) {
      this.loadSchool(o.school.id, () => undefined, false);
    }
    const itemIds = [...new Set(o.lines.map((l) => l.item.id))];
    const versions$ = itemIds.length ? forkJoin(itemIds.map((id) => this.prices.versions(id))) : of([] as PriceVersion[][]);
    versions$.subscribe((all) => {
      const byItem = new Map(itemIds.map((id, i) => [id, all[i] ?? []]));
      this.lines.set(o.lines.map((l) => ({
        lineId: l.id, itemId: l.item.id, code: l.item.code, name: l.item.name, versions: byItem.get(l.item.id) ?? [], versionId: l.price.versionId,
        quantity: l.quantity, discKind: l.itemDiscount.kind, discValue: l.itemDiscount.value, className: l.className, invoiced: l.invoicedQuantity,
      })));
      this.loading.set(false);
      this.dirty.set(false);
      this.loadChoice(false);
    });
  }

  loadChoice(useDefault: boolean): void {
    if (!this.schoolId() || !this.orderDate.value) {
      return;
    }
    this.sales.sessionChoice(this.schoolId(), this.orderDate.value).subscribe({
      next: (c) => {
        this.choice.set(c);
        if (useDefault || !this.sessions().includes(this.session())) {
          this.session.set(c.session);
        }
      },
      // The session of an existing order stays as it is when the choice cannot be read; the server checks the session on every save.
      error: () => this.choice.set(null),
    });
  }

  dateChanged(): void {
    this.dirty.set(true);
    this.loadChoice(true);
  }

  /** R4, R21: a scanned or searched item joins the line of the same item, default version and no class, or starts one. */
  addItem(item: ItemSummary): void {
    this.error.set('');
    this.prices.versions(item.id).subscribe({
      next: (versions) => {
        if (versions.length === 0) {
          this.error.set(this.translate.instant('errors.sales.no_price', { subject: item.code }));
          return;
        }
        const versionId = (versions.find((v) => v.isDefault) ?? versions[0]).id;
        const existing = this.lines().findIndex((l) => l.itemId === item.id && l.versionId === versionId && l.className === null);
        this.lines.update((ls) =>
          existing >= 0
            ? ls.map((l, i) => (i === existing ? { ...l, quantity: l.quantity + 1 } : l))
            : [...ls, { itemId: item.id, code: item.code, name: item.name, versions, versionId, quantity: 1, discKind: 'NONE', discValue: 0, className: null, invoiced: 0 }],
        );
        this.dirty.set(true);
      },
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }

  setLine(index: number, patch: Partial<EditLine>): void {
    this.lines.update((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    this.dirty.set(true);
  }

  removeLine(index: number): void {
    this.lines.update((ls) => ls.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  /** R20: a line with something invoiced keeps its version, discount and class and is not deleted. */
  locked(line: EditLine): boolean {
    return line.invoiced > 0;
  }

  /** The server's computed values of a line, once saved and unchanged. */
  saved(line: EditLine) {
    if (this.dirty()) {
      return null;
    }
    const lines = this.order()?.lines ?? [];
    return (line.lineId ? lines.find((l) => l.id === line.lineId) : lines.find((l) => l.item.id === line.itemId && l.price.versionId === line.versionId && l.className === line.className)) ?? null;
  }

  /** R22: class sets need a saved order; a new one is saved as a draft first. */
  openSets(): void {
    this.ensureSaved(() => this.setsOpen.set(true));
  }

  openBulk(): void {
    this.ensureSaved(() => this.bulkOpen.set(true));
  }

  /** R23: the ticked items go to the server with one quantity and class; the order comes back recomputed. */
  bulkPicked(pick: BulkPick): void {
    this.bulkOpen.set(false);
    const o = this.order();
    if (!o) {
      return;
    }
    this.saving.set(true);
    this.sales.addBulkLines(o.id, { itemIds: pick.items.map((i) => i.id), quantity: pick.quantity, className: pick.className }).subscribe({
      next: (r) => this.linesAdded(r),
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  /** R22, R23, R25: what was added and, by item and class, what was left out and why. */
  linesAdded(result: AddLinesResponse): void {
    this.setsOpen.set(false);
    this.saving.set(false);
    const left = result.leftOut.map((l) => {
      const who = [l.itemCode, l.className].filter(Boolean).join(' / ');
      return `${who}: ${this.translate.instant('errors.' + l.reason, { subject: who })}`;
    });
    const added = this.translate.instant('sales.classSets.added', { n: result.linesAdded });
    this.notice.set(left.length ? `${added} ${this.translate.instant('sales.classSets.leftOut')} ${left.join('; ')}` : added);
    const o = this.order();
    if (o) {
      this.loadOrder(o.id);
    }
  }

  save(): void {
    this.run(this.saveRequest$());
  }

  confirm(): void {
    this.run(this.saveRequest$().pipe(switchMap((id) => this.sales.confirmOrder(id).pipe(switchMap(() => of(id))))));
  }

  deleteDraft(): void {
    const o = this.order();
    if (!o) {
      void this.router.navigate(['/schools', this.schoolId()]);
      return;
    }
    this.sales.deleteOrder(o.id).subscribe({ next: () => void this.router.navigate(['/schools', this.schoolId()]), error: (e: unknown) => this.fail(e) });
  }

  closeOrder(): void {
    const o = this.order();
    if (!o) {
      return;
    }
    this.sales.closeOrder(o.id, this.closeReason.value).subscribe({
      next: () => {
        this.closeOpen.set(false);
        this.loadOrder(o.id);
      },
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }

  invoiceMade(invoiceId: string): void {
    void this.router.navigate(['/invoices', invoiceId]);
  }

  private request(): SaveSchoolOrderRequest {
    return {
      schoolId: this.schoolId(),
      orderDate: this.orderDate.value || undefined,
      session: this.session() || undefined,
      isGstApplied: this.isGst(),
      paymentType: this.paymentType(),
      totalDiscount: { kind: this.totalKind(), value: this.totalKind() === 'NONE' ? 0 : Number(this.totalValue()) },
      remark: this.remark.value.trim() || undefined,
      lines: this.lines().map((l) => ({
        lineId: l.lineId, itemId: l.itemId, priceVersionId: l.versionId, quantity: Number(l.quantity), className: l.className,
        itemDiscount: { kind: l.discKind, value: l.discKind === 'NONE' ? 0 : Number(l.discValue) },
      })),
    };
  }

  /** Creates or replaces the order (a draft, or a confirmed order within R20); emits the order id. */
  private saveRequest$(): Observable<string> {
    const o = this.order();
    if (!o) {
      return this.sales.createOrder(this.request()).pipe(switchMap((created) => of(created.id)));
    }
    return this.dirty() ? this.sales.replaceOrder(o.id, this.request()).pipe(switchMap(() => of(o.id))) : of(o.id);
  }

  private ensureSaved(then: () => void): void {
    if (this.order() && !this.dirty()) {
      then();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.saveRequest$().subscribe({
      next: (id) => {
        this.saving.set(false);
        if (!this.order()) {
          void this.router.navigate(['/school-orders', id], { replaceUrl: true });
        }
        this.sales.order(id).subscribe({
          next: (o) => {
            this.fill(o);
            then();
          },
          error: (e: unknown) => this.fail(e),
        });
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  private run(call: Observable<string>): void {
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    call.subscribe({
      next: (id) => {
        this.saving.set(false);
        if (!this.order()) {
          void this.router.navigate(['/school-orders', id], { replaceUrl: true });
        }
        this.loadOrder(id);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  private fail(e: unknown): void {
    this.loading.set(false);
    this.error.set(messageForError(e, this.translate));
  }
}
