import { DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CompanyService, CounterService, ItemService, PlanningService, PriceService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  Counter,
  CounterBillLineRequest,
  CounterBillMade,
  CounterPaymentRequest,
  DiscountKind,
  ITEM_CATEGORIES,
  ItemCategory,
  ItemSummary,
  MakeCounterBillRequest,
  PriceVersion,
  SchoolDetail,
} from '@org/shared-models';
import { ButtonComponent, SidePanelComponent, SkeletonLoaderComponent } from '@org/ui';
import { ItemEntryComponent } from '../sales/item-entry';
import { SaleTotalsComponent } from '../sales/sale-totals';
import { computeCounterTotals, gstModeOf } from './counter-calc';
import { CounterStudentBoxComponent, StudentSelection } from './counter-student-box';

/** One editable line of the bill; the server merges the same item and version (R43). */
interface BillLine {
  itemId: string;
  code: string;
  name: string;
  versionId: string;
  versionName: string;
  mrp: number;
  gstRatePercent: number;
  quantity: number;
  discKind: DiscountKind;
  discValue: number;
}

/** One item of a category button's list with its default MRP (sales R43). */
interface CategoryRow {
  item: ItemSummary;
  mrp: number | null;
}

const CATEGORY_PAGE = 100;

/**
 * The counter billing screen (sales spec R42-R46, R48): a full-width page at `/counters/<id>/bill`. The student box suggests the
 * school's students (R41) or takes a new one (R40); items are added by scan/search, by a category button or as the whole class book
 * list (R43); the lines carry a quantity and, when the company allows it, an item discount (R36, R43); the total discount and the GST
 * toggle (starting from the school's default, R42) are there; the totals are the live rule of R44 (the server's own, R7) and the
 * payments must equal the grand total exactly (R45). A closed counter shows a message instead of the form (R39). The stock warning
 * after saving is the answer's list of items at or below zero (R46). The API checks everything again.
 */
@Component({
  selector: 'app-counter-billing',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslatePipe,
    ButtonComponent,
    SidePanelComponent,
    SkeletonLoaderComponent,
    ItemEntryComponent,
    SaleTotalsComponent,
    CounterStudentBoxComponent,
  ],
  templateUrl: './counter-billing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterBillingComponent {
  private readonly counters = inject(CounterService);
  private readonly schoolService = inject(SchoolService);
  private readonly prices = inject(PriceService);
  private readonly items = inject(ItemService);
  private readonly planning = inject(PlanningService);
  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly counterId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly categories = ITEM_CATEGORIES;
  readonly discountKinds: DiscountKind[] = ['NONE', 'PERCENT', 'AMOUNT'];

  readonly counter = signal<Counter | null>(null);
  readonly school = signal<SchoolDetail | null>(null);
  readonly companyState = signal<string | null>(null);
  readonly usesItemDiscount = signal(false);

  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly lines = signal<BillLine[]>([]);
  readonly selection = signal<StudentSelection | null>(null);
  readonly isGst = signal(false);
  readonly totalKind = signal<DiscountKind>('NONE');
  readonly totalValue = signal(0);
  readonly remark = signal('');

  readonly cash = signal(0);
  readonly upi = signal(0);
  readonly upiRef = signal('');

  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly made = signal<CounterBillMade | null>(null);
  readonly madeWarning = signal<string[]>([]);
  /** R51: a PDF of the just-saved bill is being made (Print and Download share the button spinner). */
  readonly madeBusy = signal(false);
  readonly madeActionError = signal('');

  readonly booksBusy = signal(false);
  readonly categoryOpen = signal<ItemCategory | null>(null);
  readonly categoryRows = signal<CategoryRow[]>([]);
  readonly categoryLoading = signal(false);
  /** The search box of the category dialog and how many items were added since it opened (the dialog stays open for the next one). */
  readonly categoryQuery = signal('');
  readonly categoryAdded = signal(0);
  readonly shownCategoryRows = computed(() => {
    const needle = this.categoryQuery().trim().toLowerCase();
    return needle ? this.categoryRows().filter((r) => r.item.name.toLowerCase().includes(needle) || r.item.code.toLowerCase().includes(needle)) : this.categoryRows();
  });

  readonly closed = computed(() => this.counter()?.status === 'CLOSED');
  readonly classNames = computed(() => this.school()?.classes.map((c) => c.name) ?? []);
  readonly studentClass = computed(() => this.selection()?.className ?? '');

  readonly gstMode = computed(() => gstModeOf(this.isGst(), this.companyState(), this.school()?.state));
  readonly calc = computed(() =>
    computeCounterTotals(
      this.lines().map((l) => ({ rate: l.mrp, quantity: l.quantity, discount: { kind: l.discKind, value: l.discValue }, gstRatePercent: l.gstRatePercent })),
      { kind: this.totalKind(), value: this.totalValue() },
      this.gstMode(),
    ),
  );
  readonly grandTotal = computed(() => this.calc().totals.grandTotal);
  readonly paid = computed(() => this.cash() + this.upi());
  readonly difference = computed(() => this.grandTotal() - this.paid());
  readonly canSave = computed(
    () =>
      !this.saving() &&
      !this.booksBusy() &&
      this.lines().length > 0 &&
      this.grandTotal() > 0 &&
      this.selection() !== null &&
      this.payments().length > 0 &&
      Math.abs(this.difference()) < 0.005 &&
      this.upiRef().length <= 50,
  );

  constructor() {
    this.companies.invoiceIdentity().subscribe({ next: (i) => this.usesItemDiscount.set(i.invoice.usesItemDiscount), error: () => this.usesItemDiscount.set(false) });
    this.companies.current().subscribe({ next: (view) => this.companyState.set(view.company?.state ?? null), error: () => this.companyState.set(null) });
    this.load();
  }

  back(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/counters']);
    }
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.counters.get(this.counterId).subscribe({
      next: (counter) => {
        this.counter.set(counter);
        this.schoolService.get(counter.schoolId).subscribe({
          next: (school) => {
            this.school.set(school);
            this.isGst.set(school.isGstDefault);
            this.loading.set(false);
          },
          error: (e: unknown) => {
            this.loading.set(false);
            this.loadError.set(messageForError(e, this.translate));
          },
        });
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(e, this.translate));
      },
    });
  }

  onStudent(selection: StudentSelection | null): void {
    this.selection.set(selection);
  }

  /** R43: a scanned or searched item joins the line of the same item and version, or starts one; its default version carries the MRP. */
  addItem(item: ItemSummary): void {
    this.error.set('');
    this.notice.set('');
    this.prices.versions(item.id).subscribe({
      next: (versions) => {
        if (versions.length === 0) {
          this.error.set(this.translate.instant('errors.sales.no_price', { subject: item.code }));
          return;
        }
        this.addLine(item, versions.find((v) => v.isDefault) ?? versions[0], 1);
      },
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }

  private addLine(item: { id: string; code: string; name: string; gstRatePercent: number }, version: PriceVersion, quantity: number): void {
    this.lines.update((lines) => {
      const index = lines.findIndex((l) => l.itemId === item.id && l.versionId === version.id);
      if (index >= 0) {
        return lines.map((l, i) => (i === index ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [
        ...lines,
        { itemId: item.id, code: item.code, name: item.name, versionId: version.id, versionName: version.versionName, mrp: version.mrpAmount, gstRatePercent: item.gstRatePercent, quantity, discKind: 'NONE', discValue: 0 },
      ];
    });
  }

  setLine(index: number, patch: Partial<BillLine>): void {
    this.lines.update((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  setQuantity(index: number, value: string): void {
    const quantity = Math.max(1, Math.floor(Number(value) || 1));
    this.setLine(index, { quantity });
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  setTotalKind(kind: string): void {
    this.totalKind.set(kind as DiscountKind);
    if (kind === 'NONE') this.totalValue.set(0);
  }

  /** R43: the category buttons list the active items of one category (the ones without a barcode); a click adds one. */
  openCategory(category: ItemCategory): void {
    this.categoryOpen.set(category);
    this.categoryQuery.set('');
    this.categoryAdded.set(0);
    this.categoryRows.set([]);
    this.categoryLoading.set(true);
    forkJoin({
      items: this.items.list({ category, status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: CATEGORY_PAGE }),
      prices: this.prices.list({ category, pageIndex: 1, pageSize: CATEGORY_PAGE }),
    }).subscribe({
      next: ({ items, prices }) => {
        const mrp = new Map(prices.items.map((p) => [p.itemId, p.defaultVersion?.mrpAmount ?? null]));
        this.categoryRows.set(items.items.map((item) => ({ item, mrp: mrp.get(item.id) ?? null })));
        this.categoryLoading.set(false);
      },
      error: (e: unknown) => {
        this.categoryLoading.set(false);
        this.error.set(messageForError(e, this.translate));
        this.categoryOpen.set(null);
      },
    });
  }

  pickCategoryItem(row: CategoryRow): void {
    this.categoryAdded.update((n) => n + 1);
    this.addItem(row.item);
  }

  closeCategory(): void {
    this.categoryOpen.set(null);
  }

  /** R43, AC38: the whole class book list of the student's class, one line per book with its per-student quantity. */
  addClassBookList(): void {
    const selection = this.selection();
    const school = this.school();
    const counter = this.counter();
    if (!selection || !school || !counter) return;

    this.error.set('');
    this.notice.set('');
    this.booksBusy.set(true);
    this.planning.bookLists(school.id, counter.session).subscribe({
      next: (lists) => {
        const cls = lists.classes.find((c) => c.className === selection.className);
        if (!cls || cls.lines.length === 0) {
          this.booksBusy.set(false);
          this.notice.set(this.translate.instant('counter.billing.noBookList', { className: selection.className }));
          return;
        }
        forkJoin(cls.lines.map((line) => forkJoin({ item: this.items.get(line.itemId), versions: this.prices.versions(line.itemId) }))).subscribe({
          next: (all) => {
            this.booksBusy.set(false);
            let skipped = 0;
            all.forEach((r, i) => {
              const version = r.versions.find((v) => v.isDefault) ?? r.versions[0];
              if (!version) {
                skipped++;
                return;
              }
              this.addLine(r.item, version, cls.lines[i].quantityPerStudent);
            });
            const added = all.length - skipped;
            this.notice.set(skipped ? this.translate.instant('counter.billing.bookListSkipped', { n: added, skipped }) : this.translate.instant('counter.billing.bookListAdded', { n: added }));
          },
          error: (e: unknown) => {
            this.booksBusy.set(false);
            this.error.set(messageForError(e, this.translate));
          },
        });
      },
      error: (e: unknown) => {
        this.booksBusy.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  num(event: Event): number {
    const value = Number((event.target as HTMLInputElement).value);
    return Number.isFinite(value) ? value : 0;
  }

  /** R45: at most one payment per mode, each an amount above zero, whose sum equals the grand total. */
  private payments(): CounterPaymentRequest[] {
    const payments: CounterPaymentRequest[] = [];
    if (this.cash() > 0) payments.push({ mode: 'CASH', amount: this.cash() });
    if (this.upi() > 0) payments.push({ mode: 'UPI', amount: this.upi(), reference: this.upiRef().trim() || undefined });
    return payments;
  }

  save(): void {
    if (!this.canSave()) return;
    const selection = this.selection();
    if (!selection) return;

    this.saving.set(true);
    this.error.set('');
    const request: MakeCounterBillRequest = {
      counterId: this.counterId,
      lines: this.lines().map((l) => {
        const line: CounterBillLineRequest = { itemId: l.itemId, priceVersionId: l.versionId, quantity: l.quantity };
        if (l.discKind !== 'NONE') line.itemDiscount = { kind: l.discKind, value: l.discValue };
        return line;
      }),
      payments: this.payments(),
      studentId: selection.studentId ?? undefined,
      student: selection.student ?? undefined,
      isGstApplied: this.isGst(),
      totalDiscount: this.totalKind() === 'NONE' ? undefined : { kind: this.totalKind(), value: this.totalValue() },
      remark: this.remark().trim() || undefined,
    };

    this.counters.makeBill(request).subscribe({
      next: (made) => {
        this.saving.set(false);
        this.madeBusy.set(false);
        this.madeActionError.set('');
        const names = new Map(this.lines().map((l) => [l.itemId, `${l.name} (${l.code})`]));
        this.madeWarning.set(made.itemsAtOrBelowZero.map((id) => names.get(id) ?? id));
        this.made.set(made);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  /** R42: the next bill of the same counter; the student and the lines start empty again. */
  newBill(): void {
    this.made.set(null);
    this.madeWarning.set([]);
    this.madeBusy.set(false);
    this.madeActionError.set('');
    this.lines.set([]);
    this.selection.set(null);
    this.totalKind.set('NONE');
    this.totalValue.set(0);
    this.cash.set(0);
    this.upi.set(0);
    this.upiRef.set('');
    this.remark.set('');
    this.error.set('');
    this.notice.set('');
    this.isGst.set(this.school()?.isGstDefault ?? false);
  }

  openMade(): void {
    const made = this.made();
    if (made) void this.router.navigate(['/counters', 'bills', made.counterBillId]);
  }

  /** R51: the just-saved bill's receipt opens in a new tab for the browser's print dialog; the tab is opened first. */
  printMade(): void {
    const made = this.made();
    if (!made) return;
    const tab = window.open('', '_blank');
    this.withPdf(made, (url) => { if (tab) tab.location.href = url; }, () => tab?.close());
  }

  /** R51: the just-saved bill's receipt is saved as a file named after the bill number. */
  downloadMade(): void {
    const made = this.made();
    if (!made) return;
    this.withPdf(made, (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = made.number.split('/').join('-') + '.pdf';
      link.click();
    });
  }

  private withPdf(made: CounterBillMade, use: (objectUrl: string) => void, onError?: () => void): void {
    this.madeBusy.set(true);
    this.madeActionError.set('');
    this.counters.billPdf(made.counterBillId).subscribe({
      next: (blob) => {
        this.madeBusy.set(false);
        const url = URL.createObjectURL(blob);
        use(url);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e: unknown) => {
        this.madeBusy.set(false);
        this.madeActionError.set(messageForError(e, this.translate));
        onError?.();
      },
    });
  }
}
