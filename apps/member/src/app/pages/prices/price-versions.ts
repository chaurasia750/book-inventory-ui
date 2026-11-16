import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthService } from '@org/auth';
import { ItemService, PriceService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AuditEntry, ItemDetail, PriceVersion, PriceVersionFields } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { PriceVersionFormComponent } from './price-version-form';
import { IndianCurrencyPipe } from '../counters/indian-currency.pipe';

/**
 * The prices of one item, shown in the panel beside the price list (price spec R3-R5, R15, platform U10): the versions newest
 * first with the default marked, and for the Owner adding and editing a version and reading its history (the audit trail of that
 * version). Staff see the same without the purchase price, without buttons and without history (the API sends no purchase price).
 */
@Component({
  selector: 'app-price-versions',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent, PriceVersionFormComponent, IndianCurrencyPipe],
  templateUrl: './price-versions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceVersionsComponent {
  /** The item whose prices are open beside the list; a new id loads that item. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** A version was added or changed: the list beside it reloads. */
  readonly changed = output<void>();

  private readonly prices = inject(PriceService);
  private readonly items = inject(ItemService);
  private readonly translate = inject(TranslateService);

  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly item = signal<ItemDetail | null>(null);
  readonly versions = signal<PriceVersion[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  /** `new`, a version id being edited, or null. */
  readonly formFor = signal<'new' | string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly historyOf = signal<string | null>(null);
  readonly history = signal<AuditEntry[]>([]);
  readonly historyLoading = signal(false);
  readonly historyError = signal('');

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.formFor.set(null);
    this.historyOf.set(null);
    this.items.get(this.id()).subscribe({ next: (item) => this.item.set(item), error: () => this.item.set(null) });
    this.prices.versions(this.id()).subscribe({
      next: (versions) => {
        this.loading.set(false);
        this.versions.set(versions);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  openNew(): void {
    this.saveError.set('');
    this.formFor.set('new');
  }

  openEdit(version: PriceVersion): void {
    this.saveError.set('');
    this.formFor.set(version.id);
  }

  versionBeingEdited(): PriceVersion | null {
    return this.versions().find((v) => v.id === this.formFor()) ?? null;
  }

  save(fields: PriceVersionFields): void {
    this.saving.set(true);
    this.saveError.set('');
    const editing = this.versionBeingEdited();
    const call: Observable<unknown> = editing ? this.prices.edit(this.id(), editing.id, fields) : this.prices.add(this.id(), fields);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.saveError.set(messageForError(error, this.translate));
      },
    });
  }

  toggleHistory(version: PriceVersion): void {
    if (this.historyOf() === version.id) {
      this.historyOf.set(null);
      return;
    }

    this.historyOf.set(version.id);
    this.historyLoading.set(true);
    this.historyError.set('');
    this.prices.history(version.id).subscribe({
      next: (page) => {
        this.historyLoading.set(false);
        this.history.set(page.items);
      },
      error: (error: unknown) => {
        this.historyLoading.set(false);
        this.historyError.set(messageForError(error, this.translate));
      },
    });
  }

  /** The values of a history entry as a short text (the audit trail keeps them as JSON text). */
  describe(json: string | null): string {
    if (!json) {
      return '-';
    }

    try {
      const value = JSON.parse(json) as Record<string, unknown>;
      return ['version_name', 'effective_from', 'mrp_amount', 'sale_amount', 'purchase_amount']
        .filter((key) => key in value)
        .map((key) => `${key}: ${String(value[key])}`)
        .join(', ');
    } catch {
      return json;
    }
  }
}
