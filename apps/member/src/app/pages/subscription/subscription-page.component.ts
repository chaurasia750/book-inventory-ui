import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CompanyBankAccount, Kit, MediaService, MembersService, OrderService } from '@org/api-services';
import { DatePickerComponent, DisableOnRequestDirective, PaymentQrComponent, ToastService } from '@org/ui';
import { OrderListComponent } from '../order-list/order-list';

export type SubscriptionTab = 'buy' | 'view';

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePickerComponent, PaymentQrComponent, DisableOnRequestDirective, OrderListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription-page.component.html',
})
export class SubscriptionPageComponent implements OnInit {
  private static readonly SUBSCRIPTION_KIT_ID = 2;
  private static readonly INACTIVE_STATUSES = new Set(['Rejected', 'Cancelled']);

  private readonly membersService = inject(MembersService);
  private readonly orderService = inject(OrderService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly activeTab = signal<SubscriptionTab>('buy');

  readonly kit = signal<Kit | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly hasNoOrder = signal<boolean | null>(null);

  /** Whether the member already has a subscription order that isn't Rejected/Cancelled -- if so,
   * they've used their one purchase and the Buy tab is hidden until that order is cancelled. */
  readonly hasActiveSubscriptionOrder = signal<boolean | null>(null);

  readonly paymentMode = signal('');
  readonly paymentTypeId = signal<number | null>(null);
  readonly filteredBankAccounts = signal<CompanyBankAccount[]>([]);
  readonly selectedBank = signal<CompanyBankAccount | null>(null);

  selectedBankAccNo = '';
  referenceNumber = '';
  remark = '';
  receiptFile: File | null = null;
  paymentDate: string = new Date().toISOString().split('T')[0];
  companyName = 'Book Inventory';

  private bankAccounts: CompanyBankAccount[] = [];
  private defaultsApplied = false;

  ngOnInit(): void {
    this.loadKit();
    this.loadBankAccounts();
    this.checkActivation();
  }

  setTab(tab: SubscriptionTab): void {
    if (tab === 'buy' && this.hasActiveSubscriptionOrder() === true) return;
    this.activeTab.set(tab);
  }

  onPaymentModeChange(mode: string): void {
    this.paymentMode.set(mode);
    this.selectedBankAccNo = '';
    this.selectedBank.set(null);
    if (mode === 'Account') {
      this.paymentTypeId.set(1);
      this.filteredBankAccounts.set(this.bankAccounts.filter((b) => b.paymentTypeId === 1));
    } else if (mode === 'UPI') {
      this.paymentTypeId.set(2);
      this.filteredBankAccounts.set(this.bankAccounts.filter((b) => b.paymentTypeId === 2));
      if (this.filteredBankAccounts().length > 0) {
        const first = this.filteredBankAccounts()[0];
        const upiVal = first.upiId || first.accountNo;
        this.selectedBankAccNo = upiVal;
        this.onBankChange(upiVal);
      }
    } else {
      this.paymentTypeId.set(null);
      this.filteredBankAccounts.set([]);
    }
    if (mode === 'Cash') {
      this.referenceNumber = '';
      this.receiptFile = null;
    }
    this.cdr.markForCheck();
  }

  onBankChange(accNo: string): void {
    this.selectedBankAccNo = accNo;
    const bank = this.bankAccounts.find(
      (b) => (b.upiId && String(b.upiId) === String(accNo)) || String(b.accountNo) === String(accNo),
    );
    this.selectedBank.set(bank ?? null);
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.receiptFile = input.files[0];
    }
  }

  onSubmit(form: NgForm): void {
    const kit = this.kit();
    if (form.invalid || !this.paymentDate || (this.paymentMode() !== 'Cash' && !this.receiptFile) || !kit) return;

    const submitOrder = (mediaFileId: number | null) => {
      const method = this.paymentMode();
      const paymentMode = ['UPI', 'Account', 'Card'].includes(method) ? 'Online' : 'Offline';
      this.orderService
        .createOrder({
          orderType: 'EPIN',
          paymentMode,
          remarks: this.remark,
          items: [
            {
              itemId: kit.id,
              itemName: kit.kitCode,
              quantity: 1,
              unitPrice: kit.kitPrice,
            },
          ],
          offlinePayment: {
            paymentMethod: method === 'Account' ? 'BankTransfer' : method,
            referenceNumber: this.referenceNumber,
            paymentDate: new Date(this.paymentDate).toISOString(),
            mediaFileId: mediaFileId ?? 0,
            remarks: this.remark,
          },
        })
        .subscribe({
          next: () => {
            this.resetForm();
            this.successMessage.set('Subscription payment submitted! Your account will be activated once admin approves it.');
            this.toastService.show('Subscription order placed successfully.', 'success');
            this.activeTab.set('view');
            this.checkActivation();
            this.checkExistingSubscriptionOrder();
            this.cdr.markForCheck();
          },
          error: () => { /* handled by toast interceptor */ },
        });
    };

    if (this.receiptFile) {
      this.mediaService.tempUpload([this.receiptFile]).subscribe({
        next: (res) => {
          const mediaFileId = res.files?.[0]?.id ?? null;
          submitOrder(mediaFileId);
        },
        error: () => submitOrder(null),
      });
    } else {
      submitOrder(null);
    }
  }

  maskAccountNo(accNo: string): string {
    if (!accNo || accNo.length <= 4) return '****';
    return '****' + accNo.slice(4);
  }

  getIfscCode(bank: CompanyBankAccount): string {
    return bank.ifscCode || bank.ifsccode || '';
  }

  getUpiDisplay(bank: CompanyBankAccount): string {
    return bank.upiId || bank.accountNo;
  }

  private resetForm(): void {
    this.paymentMode.set('');
    this.paymentTypeId.set(null);
    this.filteredBankAccounts.set([]);
    this.selectedBank.set(null);
    this.selectedBankAccNo = '';
    this.referenceNumber = '';
    this.remark = '';
    this.receiptFile = null;
    this.cdr.markForCheck();
  }

  private checkActivation(): void {
    this.orderService.hasNoPurchasedOrder().subscribe({
      next: (noOrder) => {
        this.hasNoOrder.set(noOrder);
        this.cdr.markForCheck();
      },
      error: () => this.hasNoOrder.set(null),
    });
  }

  private checkExistingSubscriptionOrder(): void {
    const kit = this.kit();
    if (!kit) return;

    this.orderService.getMyOrders({ page: 1, pageSize: 50 }).subscribe({
      next: (res) => {
        const hasActive = (res.items ?? []).some(
          (o) => o.totalAmount === kit.kitPrice && !SubscriptionPageComponent.INACTIVE_STATUSES.has(o.status),
        );
        this.hasActiveSubscriptionOrder.set(hasActive);
        if (hasActive && this.activeTab() === 'buy') {
          this.activeTab.set('view');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.hasActiveSubscriptionOrder.set(null);
        this.cdr.markForCheck();
      },
    });
  }

  private loadKit(): void {
    this.membersService.getKits().subscribe({
      next: (res: any) => {
        const unwrapped = res?.data ?? res;
        const rawKits: Kit[] = unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
        const subscriptionKit = rawKits.find((k) => k.id === SubscriptionPageComponent.SUBSCRIPTION_KIT_ID) ?? null;
        this.kit.set(subscriptionKit);
        if (!subscriptionKit) {
          this.errorMessage.set('Subscription plan is not available right now. Please contact support.');
        } else {
          this.checkExistingSubscriptionOrder();
        }
        this.loading.set(false);
        this.applyDefaults();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.errorMessage.set(`Failed to load subscription plan: ${err.status ?? 'network error'}`);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private loadBankAccounts(): void {
    this.membersService.getCompanyBankAccounts().subscribe({
      next: (res: any) => {
        const unwrapped = res?.data ?? res;
        this.bankAccounts = unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
        this.applyDefaults();
        this.cdr.markForCheck();
      },
      error: () => {
        this.bankAccounts = [];
        this.cdr.markForCheck();
      },
    });
  }

  private applyDefaults(): void {
    if (this.defaultsApplied || !this.kit() || this.bankAccounts.length === 0) return;
    this.defaultsApplied = true;
    this.paymentMode.set('UPI');
    this.onPaymentModeChange('UPI');
  }
}
