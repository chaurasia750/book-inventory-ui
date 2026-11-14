import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PriceService, VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  BulkPreviewResult,
  BulkPriceRequest,
  BulkTotals,
  ITEM_CATEGORIES,
  ItemCategory,
  PriceChange,
  PriceChangeDirection,
  PriceChangeKind,
} from '@org/shared-models';
import { BackButtonComponent, ButtonComponent, CardComponent, ModalComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';

const PREVIEW_PAGE_SIZE = 50;
const VALUE_PATTERN = /^\d+(\.\d{1,2})?$/;
const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The bulk price change (price spec R10-R13, AC9, AC10): choose the items (vendor, category, class or all), the version to
 * change and, per price field, an increase or decrease by percent or rupees; Preview shows every old and new price and the
 * skipped items with their reason, then Apply asks for a confirmation that names the item count. The page never computes a
 * price itself: the numbers are always the server's. Any change to the inputs clears the preview and disables Apply.
 */
@Component({
  selector: 'app-price-bulk',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    BackButtonComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './price-bulk.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceBulkComponent {
  private readonly prices = inject(PriceService);
  private readonly vendors = inject(VendorService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly field = FIELD;
  readonly categories = ITEM_CATEGORIES;
  readonly kinds: PriceChangeKind[] = ['PERCENT', 'AMOUNT'];
  readonly directions: PriceChangeDirection[] = ['INCREASE', 'DECREASE'];
  readonly previewPageSize = PREVIEW_PAGE_SIZE;

  readonly vendorOptions = signal<{ id: string; name: string }[]>([]);

  readonly form = new FormGroup({
    versionName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
    }),
    vendorId: new FormControl('', { nonNullable: true }),
    category: new FormControl<ItemCategory | ''>('', { nonNullable: true }),
    className: new FormControl('', { nonNullable: true }),
    onlyActive: new FormControl(false, { nonNullable: true }),
    mrpEnabled: new FormControl(false, { nonNullable: true }),
    mrpKind: new FormControl<PriceChangeKind>('PERCENT', { nonNullable: true }),
    mrpDirection: new FormControl<PriceChangeDirection>('INCREASE', { nonNullable: true }),
    mrpValue: new FormControl('', { nonNullable: true, validators: [Validators.pattern(VALUE_PATTERN)] }),
    saleEnabled: new FormControl(false, { nonNullable: true }),
    saleKind: new FormControl<PriceChangeKind>('PERCENT', { nonNullable: true }),
    saleDirection: new FormControl<PriceChangeDirection>('INCREASE', { nonNullable: true }),
    saleValue: new FormControl('', { nonNullable: true, validators: [Validators.pattern(VALUE_PATTERN)] }),
    purchaseEnabled: new FormControl(false, { nonNullable: true }),
    purchaseKind: new FormControl<PriceChangeKind>('PERCENT', { nonNullable: true }),
    purchaseDirection: new FormControl<PriceChangeDirection>('INCREASE', { nonNullable: true }),
    purchaseValue: new FormControl('', { nonNullable: true, validators: [Validators.pattern(VALUE_PATTERN)] }),
  });

  readonly formError = signal('');
  readonly preview = signal<BulkPreviewResult | null>(null);
  readonly previewPage = signal(1);
  readonly previewLoading = signal(false);
  readonly previewError = signal('');

  readonly confirmOpen = signal(false);
  readonly applying = signal(false);
  readonly applyError = signal('');
  readonly applied = signal<BulkTotals | null>(null);

  /** The inputs the current preview was made for; apply sends the same ones, recomputed on the server. */
  private lastRequest: BulkPriceRequest | null = null;

  constructor() {
    this.vendors
      .list({ status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: 200 })
      .subscribe((result) => this.vendorOptions.set(result.items.map((v) => ({ id: v.id, name: v.name }))));

    // R13: any change to the inputs clears the preview, so Apply can never act on stale numbers.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formError.set('');
      this.preview.set(null);
      this.previewError.set('');
      this.applied.set(null);
      this.applyError.set('');
      this.lastRequest = null;
    });
  }

  back(): void {
    void this.router.navigate(['/prices']);
  }

  runPreview(): void {
    const request = this.buildRequest();
    if (!request) {
      return;
    }
    this.lastRequest = request;
    this.loadPreview(1);
  }

  goToPreviewPage(page: number): void {
    this.loadPreview(page);
  }

  askApply(): void {
    if (!this.preview() || !this.lastRequest || this.applied()) {
      return;
    }
    this.applyError.set('');
    this.confirmOpen.set(true);
  }

  confirmApply(): void {
    const request = this.lastRequest;
    if (!request) {
      return;
    }

    this.applying.set(true);
    this.applyError.set('');
    this.prices.bulkApply({ ...request, pageIndex: 1, pageSize: PREVIEW_PAGE_SIZE }).subscribe({
      next: (totals) => {
        this.applying.set(false);
        this.confirmOpen.set(false);
        this.preview.set(null);
        this.lastRequest = null;
        this.applied.set(totals);
      },
      error: (error: unknown) => {
        this.applying.set(false);
        this.applyError.set(messageForError(error, this.translate));
      },
    });
  }

  private loadPreview(page: number): void {
    const request = this.lastRequest;
    if (!request) {
      return;
    }

    this.previewLoading.set(true);
    this.previewError.set('');
    this.previewPage.set(page);
    this.prices.bulkPreview({ ...request, pageIndex: page, pageSize: PREVIEW_PAGE_SIZE }).subscribe({
      next: (result) => {
        this.previewLoading.set(false);
        this.preview.set(result);
      },
      error: (error: unknown) => {
        this.previewLoading.set(false);
        this.preview.set(null);
        this.previewError.set(messageForError(error, this.translate));
      },
    });
  }

  /** R10, R11: the request of the current inputs, or null with a message when one is missing or invalid. */
  private buildRequest(): BulkPriceRequest | null {
    const v = this.form.getRawValue();
    const versionName = v.versionName.trim();
    if (versionName.length < 2 || versionName.length > 30) {
      this.formError.set(this.translate.instant('price.bulk.invalid.version'));
      return null;
    }

    const rows: [boolean, string][] = [
      [v.mrpEnabled, v.mrpValue],
      [v.saleEnabled, v.saleValue],
      [v.purchaseEnabled, v.purchaseValue],
    ];
    if (rows.some(([enabled, value]) => enabled && !VALUE_PATTERN.test(value.trim()))) {
      this.formError.set(this.translate.instant('price.bulk.invalid.change'));
      return null;
    }

    const mrp = this.changeOf(v.mrpEnabled, v.mrpKind, v.mrpDirection, v.mrpValue);
    const sale = this.changeOf(v.saleEnabled, v.saleKind, v.saleDirection, v.saleValue);
    const purchase = this.changeOf(v.purchaseEnabled, v.purchaseKind, v.purchaseDirection, v.purchaseValue);
    if (!mrp && !sale && !purchase) {
      this.formError.set(this.translate.instant('price.bulk.invalid.none'));
      return null;
    }

    this.formError.set('');
    return {
      versionName,
      selection: {
        vendorId: v.vendorId || undefined,
        category: v.category || undefined,
        className: v.className.trim() || undefined,
        onlyActive: v.onlyActive,
      },
      mrp,
      sale,
      purchase,
    };
  }

  private changeOf(
    enabled: boolean,
    kind: PriceChangeKind,
    direction: PriceChangeDirection,
    value: string,
  ): PriceChange | undefined {
    return enabled ? { kind, direction, value: Number(value.trim()) } : undefined;
  }
}
