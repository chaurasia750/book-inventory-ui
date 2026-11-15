import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '@org/auth';
import { PriceService, SalesService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { DiscountKind, ItemSummary, PriceVersion, SaveSchoolOrderRequest, SchoolOrderDetail, SessionChoice } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { ItemEntryComponent } from './item-entry';
import { MakeInvoiceComponent } from './make-invoice';
import { SaleTotalsComponent } from './sale-totals';

/** One editable line of a draft. */
interface EditLine {
  itemId: string;
  code: string;
  name: string;
  versions: PriceVersion[];
  versionId: string;
  quantity: number;
  discKind: DiscountKind;
  discValue: number;
}

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

/**
 * The full-width order page (sales spec R2-R7, R14, Q11): a draft is edited here (school, date, session choice, GST, lines by scan
 * or search with a price version, quantity and item discount, total discount) and saved, confirmed or deleted; a confirmed order is
 * shown read-only with its invoices, "Make invoice" and the Owner's Close. Every amount is the server's, shown after each save.
 */
@Component({
  selector: 'app-order-editor',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, DatePickerComponent, ModalComponent, SkeletonLoaderComponent, ItemEntryComponent, MakeInvoiceComponent, SaleTotalsComponent],
  templateUrl: './order-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderEditorComponent {
  private readonly sales = inject(SalesService);
  private readonly schools = inject(SchoolService);
  private readonly prices = inject(PriceService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly isOwner = inject(AuthService).hasAppRole('OWNER');
  readonly field = FIELD;
  readonly discountKinds: DiscountKind[] = ['NONE', 'PERCENT', 'AMOUNT'];

  readonly order = signal<SchoolOrderDetail | null>(null);
  readonly schoolId = signal('');
  readonly schoolName = signal('');
  readonly lines = signal<EditLine[]>([]);
  readonly choice = signal<SessionChoice | null>(null);
  readonly session = signal('');
  readonly isGst = signal(false);
  readonly totalKind = signal<DiscountKind>('NONE');
  readonly totalValue = signal(0);
  readonly orderDate = new FormControl('', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly dirty = signal(false);
  readonly closeOpen = signal(false);
  readonly closeReason = new FormControl('', { nonNullable: true });
  readonly invoiceOpen = signal(false);

  readonly editable = computed(() => (this.order()?.status ?? 'DRAFT') === 'DRAFT');
  readonly sessions = computed(() => {
    const c = this.choice();
    return c ? [c.previous, c.session, c.next] : [];
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadOrder(id);
    } else {
      this.startNew(this.route.snapshot.queryParamMap.get('schoolId') ?? '');
    }
  }

  private startNew(schoolId: string): void {
    this.schoolId.set(schoolId);
    this.orderDate.setValue(new Date().toISOString().slice(0, 10));
    this.schools.get(schoolId).subscribe({
      next: (s) => {
        this.schoolName.set(s.name);
        this.isGst.set(s.isGstDefault);
        this.loading.set(false);
        this.loadChoice(true);
      },
      error: (e: unknown) => this.fail(e),
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
    this.totalKind.set(o.totalDiscount.kind);
    this.totalValue.set(o.totalDiscount.value);
    const versions$ = o.lines.length ? forkJoin(o.lines.map((l) => this.prices.versions(l.item.id))) : of([] as PriceVersion[][]);
    versions$.subscribe((all) => {
      this.lines.set(o.lines.map((l, i) => ({
        itemId: l.item.id, code: l.item.code, name: l.item.name, versions: all[i] ?? [], versionId: l.price.versionId,
        quantity: l.quantity, discKind: l.itemDiscount.kind, discValue: l.itemDiscount.value,
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
    this.sales.sessionChoice(this.schoolId(), this.orderDate.value).subscribe((c) => {
      this.choice.set(c);
      if (useDefault || !this.sessions().includes(this.session())) {
        this.session.set(c.session);
      }
    });
  }

  dateChanged(): void {
    this.dirty.set(true);
    this.loadChoice(true);
  }

  addItem(item: ItemSummary): void {
    this.error.set('');
    this.prices.versions(item.id).subscribe({
      next: (versions) => {
        if (versions.length === 0) {
          this.error.set(this.translate.instant('errors.sales.no_price'));
          return;
        }
        const versionId = (versions.find((v) => v.isDefault) ?? versions[0]).id;
        const existing = this.lines().findIndex((l) => l.itemId === item.id && l.versionId === versionId);
        this.lines.update((ls) =>
          existing >= 0
            ? ls.map((l, i) => (i === existing ? { ...l, quantity: l.quantity + 1 } : l))
            : [...ls, { itemId: item.id, code: item.code, name: item.name, versions, versionId, quantity: 1, discKind: 'NONE', discValue: 0 }],
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

  /** The server's computed values of a draft line, once saved and unchanged. */
  saved(line: EditLine) {
    return this.dirty() ? null : this.order()?.lines.find((l) => l.item.id === line.itemId && l.price.versionId === line.versionId) ?? null;
  }

  save(): void {
    this.run(this.saveRequest$(), () => undefined);
  }

  confirm(): void {
    this.run(this.saveRequest$().pipe(switchMap((id) => this.sales.confirmOrder(id).pipe(switchMap(() => of(id))))), () => undefined);
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
      totalDiscount: { kind: this.totalKind(), value: this.totalKind() === 'NONE' ? 0 : Number(this.totalValue()) },
      remark: this.remark.value.trim() || undefined,
      lines: this.lines().map((l) => ({
        itemId: l.itemId, priceVersionId: l.versionId, quantity: Number(l.quantity),
        itemDiscount: { kind: l.discKind, value: l.discKind === 'NONE' ? 0 : Number(l.discValue) },
      })),
    };
  }

  /** Creates or replaces the draft; emits the order id. */
  private saveRequest$(): Observable<string> {
    const o = this.order();
    if (!o) {
      return this.sales.createOrder(this.request()).pipe(switchMap((created) => of(created.id)));
    }
    return this.dirty() ? this.sales.replaceOrder(o.id, this.request()).pipe(switchMap(() => of(o.id))) : of(o.id);
  }

  private run(call: Observable<string>, after: () => void): void {
    this.saving.set(true);
    this.error.set('');
    call.subscribe({
      next: (id) => {
        this.saving.set(false);
        after();
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
