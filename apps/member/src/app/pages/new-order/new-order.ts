import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MembersService, MemberProfileService, Kit, CompanyBankAccount } from '@org/api-services';
import { OrderService } from '@org/api-services';
import { MediaService } from '@org/api-services';
import { ToastService, BreadcrumbComponent, PaymentQrComponent, DisableOnRequestDirective, DatePickerComponent } from '@org/ui';

interface KitProduct extends Kit {
  name: string;
  desc: string;
  badge: string;
  rating: number;
  reviews: number;
  icon: string;
  gradient: string;
  products: string[];
  courseDetails: string[];
  liveProjects: string[];
}

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, BreadcrumbComponent, PaymentQrComponent, DisableOnRequestDirective, DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-order.html',
})
export class NewOrderComponent implements OnInit {
  @ViewChild('paymentSection') paymentSection!: ElementRef;

  private readonly membersService = inject(MembersService);
  private readonly orderService = inject(OrderService);
  private readonly profileService = inject(MemberProfileService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly kits = signal<KitProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly selectedKitId = signal<number | null>(null);
  readonly selectedKit = signal<KitProduct | null>(null);
  readonly selectedPrice = signal<number | null>(null);
  readonly quantity = signal(1);
  readonly amount = signal(0);
  readonly showPayment = signal(false);
  readonly paymentMode = signal('');
  readonly paymentTypeId = signal<number | null>(null);
  readonly filteredBankAccounts = signal<CompanyBankAccount[]>([]);
  readonly selectedBank = signal<CompanyBankAccount | null>(null);

  selectedBankAccNo = '';
  referenceNumber = '';
  remark = '';
  receiptFile: File | null = null;
  receiptMediaId: number | null = null;
  paymentDate: string = new Date().toISOString().split('T')[0];
  companyName = 'Book Inventory';

  private bankAccounts: CompanyBankAccount[] = [];
  private defaultsApplied = false;

  readonly isStepComplete = (): boolean => this.selectedKitId() !== null && this.quantity() > 0;

  private readonly kitMeta: Record<string, Partial<KitProduct>> = {
    '5M': { name: '5 Mukhi Nepali Rudraksha Mala', desc: 'Original Panchmukhi Rudraksha mala from Nepal. Ideal for japa meditation and daily spiritual wear.', badge: 'Best Seller', rating: 5, reviews: 342, icon: 'fa-diamond', gradient: 'from-amber-50 to-orange-50' },
    '7M': { name: '7 Mukhi Rudraksha Mala (Gold Plated)', desc: 'Saatmukhi Rudraksha mala for wealth and prosperity. Gold-plated premium design.', badge: '', rating: 4, reviews: 201, icon: 'fa-diamond', gradient: 'from-yellow-50 to-amber-50' },
    '1M': { name: '1 Mukhi Rudraksha Pendant (Pure Silver)', desc: 'Rare Ek Mukhi Rudraksha in pure silver pendant. The ultimate symbol of Lord Shiva.', badge: 'Trending', rating: 5, reviews: 128, icon: 'fa-diamond', gradient: 'from-emerald-50 to-teal-50' },
    '2M': { name: '2 Mukhi Rudraksha Pendant (Silver)', desc: 'Dwimukhi Rudraksha in silver pendant for unity, harmony, and emotional balance.', badge: '', rating: 5, reviews: 64, icon: 'fa-diamond', gradient: 'from-saffron-50 to-saffron-50' },
    '9M': { name: '9 Mukhi Rudraksha Mala (Durga)', desc: 'Navmukhi Rudraksha mala for courage and divine protection. Blessed by Goddess Durga.', badge: 'New', rating: 5, reviews: 47, icon: 'fa-diamond', gradient: 'from-red-50 to-pink-50' },
    '11M': { name: '11 Mukhi Rudraksha (Hanuman)', desc: 'Symbolizes Lord Hanuman. Grants courage, strength, and fearlessness.', badge: '', rating: 5, reviews: 35, icon: 'fa-diamond', gradient: 'from-orange-50 to-red-50' },
    '14M': { name: '14 Mukhi Rudraksha Bead (Hanuman)', desc: 'The divine bead for ultimate protection and courage. Rarest and most powerful variety.', badge: 'Premium', rating: 5, reviews: 22, icon: 'fa-diamond', gradient: 'from-purple-50 to-pink-50' },
  };

  private readonly defaultMeta: Partial<KitProduct> = {
    desc: 'Genuine Rudraksha kit with authentic beads for spiritual growth and protection.',
    badge: '', rating: 4, reviews: 100, icon: 'fa-diamond', gradient: 'from-brown-50 to-amber-50',
  };

  ngOnInit(): void {
    this.loadKits();
    this.loadBankAccounts();
  }

  selectKit(kit: KitProduct): void {
    this.selectedKitId.set(kit.id);
    this.selectedKit.set(kit);
    this.selectedPrice.set(kit.kitPrice);
    this.quantity.set(1);
    this.amount.set(this.quantity() * (kit.kitPrice || 0));
    this.cdr.markForCheck();
  }

  buyKit(kit: KitProduct): void {
    this.selectKit(kit);
    this.showPayment.set(true);
    setTimeout(() => {
      this.paymentSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  changeQty(delta: number): void {
    const newQty = this.quantity() + delta;
    if (newQty >= 1 && newQty <= 99) {
      this.quantity.set(newQty);
      this.amount.set(this.quantity() * (this.selectedPrice() || 0));
    }
  }

  onQtyChange(): void {
    const qty = this.quantity();
    if (qty >= 1 && qty <= 99) {
      this.amount.set(qty * (this.selectedPrice() || 0));
    }
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
    if (form.invalid || !this.paymentDate || (this.paymentMode() !== 'Cash' && !this.receiptFile)) return;

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
              itemId: Number(this.selectedKitId()),
              itemName: this.selectedKit()?.kitCode ?? '',
              quantity: this.quantity(),
              unitPrice: this.selectedPrice() ?? 0,
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
            this.successMessage.set('Order placed successfully! Your request is being processed.');
            this.toastService.show('Order placed successfully.', 'success');
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

  private parseKitProducts(raw?: string): string[] {
    return (raw ?? '')
      .split(',')
      .map((item) => item.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  private resetForm(): void {
    this.selectedKitId.set(null);
    this.selectedKit.set(null);
    this.selectedPrice.set(null);
    this.quantity.set(1);
    this.amount.set(0);
    this.paymentMode.set('');
    this.paymentTypeId.set(null);
    this.filteredBankAccounts.set([]);
    this.selectedBank.set(null);
    this.selectedBankAccNo = '';
    this.referenceNumber = '';
    this.remark = '';
    this.receiptFile = null;
    this.receiptMediaId = null;
    this.showPayment.set(false);
    this.cdr.markForCheck();
  }

  private loadKits(): void {
    this.membersService.getKits().subscribe({
      next: (res: any) => {
        const unwrapped = res?.data ?? res;
        const rawKits: Kit[] = unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
        this.kits.set(
          rawKits.map((kit) => {
            const code = (kit.kitCode || '').toUpperCase().replace(/\s+/g, '');
            let meta = this.defaultMeta;
            for (const [key, m] of Object.entries(this.kitMeta)) {
              if (code.includes(key)) { meta = m; break; }
            }
            const products = this.parseKitProducts(kit.kitProducts);
            const liveStart = products.findIndex((p) => p.toLowerCase() === 'live project');
            const courseDetails = liveStart === -1 ? products : products.slice(0, liveStart + 1);
            const liveProjects = liveStart === -1 ? [] : products.slice(liveStart + 1);
            return { ...kit, ...meta, products, courseDetails, liveProjects } as KitProduct;
          }),
        );
        this.loading.set(false);
        this.applyDefaults();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.errorMessage.set(`Failed to load kits: ${err.status ?? 'network error'}${err.url ? ' — ' + err.url : ''}`);
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
        if (this.paymentTypeId() !== null) {
          this.filteredBankAccounts.set(this.bankAccounts.filter((b) => b.paymentTypeId === this.paymentTypeId()));
          if (this.filteredBankAccounts().length > 0 && !this.selectedBankAccNo) {
            const first = this.filteredBankAccounts()[0];
            const upiVal = first.upiId || first.accountNo;
            this.selectedBankAccNo = upiVal;
            this.onBankChange(upiVal);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.bankAccounts = [];
        this.cdr.markForCheck();
      },
    });
  }

  private applyDefaults(): void {
    if (this.defaultsApplied || this.kits().length === 0) return;
    this.defaultsApplied = true;
    const firstKit = this.kits()[0];
    this.selectedKitId.set(firstKit.id);
    this.selectedKit.set(firstKit);
    this.selectedPrice.set(firstKit.kitPrice);
    this.quantity.set(1);
    this.amount.set(this.quantity() * (this.selectedPrice() || 0));
    this.paymentMode.set('UPI');
    this.onPaymentModeChange('UPI');
  }
}
