import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { VendorDetail } from '@org/shared-models';
import { vendorStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

/**
 * One vendor (vendor spec R2-R7): the master data with the generated code read-only, the bank details in full (the Owner's
 * view, R5) and activate / deactivate. The edit form opens in the panel through the page (`editRequested`). The API enforces
 * every rule again; its catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent],
  templateUrl: './vendor-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDetailComponent {
  /** The vendor open beside the list (platform U10); a new id loads that vendor. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The vendor's status changed: the list beside it reloads. */
  readonly changed = output<void>();
  /** The Edit button: the page opens the edit form in the panel. */
  readonly editRequested = output<void>();

  private readonly vendors = inject(VendorService);
  private readonly translate = inject(TranslateService);

  readonly vendor = signal<VendorDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = vendorStatusBadgeClass;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.vendors.get(this.id()).subscribe({
      next: (vendor) => {
        this.loading.set(false);
        this.vendor.set(vendor);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  openStatus(): void {
    this.statusError.set('');
    this.statusOpen.set(true);
  }

  changeStatus(): void {
    const vendor = this.vendor();
    if (!vendor) {
      return;
    }

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = vendor.status === 'ACTIVE' ? this.vendors.deactivate(this.id()) : this.vendors.activate(this.id());
    call.subscribe({
      next: () => {
        this.statusSaving.set(false);
        this.statusOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.statusSaving.set(false);
        this.statusError.set(messageForError(error, this.translate));
      },
    });
  }
}
