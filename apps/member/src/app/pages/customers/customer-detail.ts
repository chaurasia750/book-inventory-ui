import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CustomerService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CustomerDetail } from '@org/shared-models';
import { customerStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { MoneyPipe } from '../counters/money.pipe';

/**
 * One customer's page (customer spec R2-R7, R9): the master data with the generated code read-only, the opening balance and the
 * credit limit, and activate / deactivate. Only the Owner sees Edit, Activate and Deactivate (R9); the edit form opens in the panel
 * through the page (`editRequested`). The API enforces every rule again; its catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, MoneyPipe],
  templateUrl: './customer-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailComponent {
  /** The customer open beside the list (platform U10); a new id loads that customer. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The customer's status changed: the list beside it reloads. */
  readonly changed = output<void>();
  /** The Edit button: the page opens the edit form in the panel. */
  readonly editRequested = output<void>();

  private readonly customers = inject(CustomerService);
  private readonly translate = inject(TranslateService);

  /** Customer spec R9: Staff read but never change a customer. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly customer = signal<CustomerDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = customerStatusBadgeClass;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.customers.get(this.id()).subscribe({
      next: (customer) => {
        this.loading.set(false);
        this.customer.set(customer);
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
    const customer = this.customer();
    if (!customer) {
      return;
    }

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = customer.status === 'ACTIVE' ? this.customers.deactivate(this.id()) : this.customers.activate(this.id());
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
