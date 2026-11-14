import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, signal, computed } from '@angular/core';
import { DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '@org/api-services';

@Component({
  selector: 'app-member-wallet',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-wallet.component.html',
})
export class MemberWalletComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly totalInAmount = signal(0);
  readonly totalOutAmount = signal(0);
  readonly lockAmount = signal(0);
  readonly availableBalance = signal(0);
  readonly levelIncome = signal(0);
  readonly directIncome = signal(0);
  readonly depositByAdmin = signal(0);
  readonly deductByAdmin = signal(0);
  readonly tds = signal(0);
  readonly adminCharge = signal(0);
  readonly ledgerBalance = signal(0);

  readonly transactions = signal<TransactionItem[]>([]);
  readonly loading = signal(true);

  readonly creditInTransactions = computed(() =>
    this.transactions().filter(tx => {
      const t = (tx.transType || '').toLowerCase();
      return t.includes('credit') || t.includes('level') || t.includes('direct') || t.includes('deposit');
    })
  );

  readonly creditOutTransactions = computed(() =>
    this.transactions().filter(tx => {
      const t = (tx.transType || '').toLowerCase();
      return t.includes('deduct') || t.includes('tds') || t.includes('admin') || t.includes('debit');
    })
  );

  readonly lockTransactions = computed(() =>
    this.transactions().filter(tx => {
      const t = (tx.transType || '').toLowerCase();
      return t.includes('lock');
    })
  );

  readonly activeTab = signal<string>('credit-in');

  selectTab(tab: string): void {
    this.activeTab.set(tab);
  }

  goTo(tab: string): void {
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    this.activeTab.set(tab);
  }

  abs = Math.abs;

  ngAfterViewInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) {
      this.activeTab.set(tab);
    }

    const url = window.location.href;
    const match = url.match(/members\/([^/]+)/);
    const memberId = match ? match[1] : '';

    console.log('[MemberWallet] URL:', url);
    console.log('[MemberWallet] memberId from URL:', memberId);

    if (memberId) {
      this.fetchTransactions(memberId);
    } else {
      console.warn('[MemberWallet] No memberId found in URL');
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    // noop
  }

  private fetchTransactions(memberId: string): void {
    const url = `${this.baseUrl}/incomes/transactions/${memberId}/list`;
    console.log('[MemberWallet] Calling:', url);

    this.http
      .get<any>(url)
      .subscribe({
        next: (res) => {
          console.log('[MemberWallet] API response:', res);
          const root = res && typeof res === 'object' ? res : {};
          const data = (root.data ?? root.result ?? root) as Record<string, unknown>;
          let items: any[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (data && typeof data === 'object') {
            items = (data['items'] ?? data['transactions'] ?? data['data'] ?? []) as any[];
          }
          const mapped: TransactionItem[] = items.map((item: any) => ({
            id: Number(item.id) || 0,
            transType: String(item.transType ?? item.trans_type ?? item.type ?? ''),
            remark: String(item.remark ?? item.description ?? item.narration ?? ''),
            amount: Number(item.amount) || 0,
            transDate: String(item.transDate ?? item.trans_date ?? item.date ?? ''),
          }));
          console.log('[MemberWallet] transType values:', [...new Set(mapped.map(tx => tx.transType))]);
          this.transactions.set(mapped);
          this.computeBreakdown(mapped);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[MemberWallet] API error:', err);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private computeBreakdown(items: TransactionItem[]): void {
    let creditIn = 0;
    let creditOut = 0;
    let lock = 0;
    let balance = 0;
    let level = 0;
    let direct = 0;
    let deposit = 0;
    let deduct = 0;
    let tdsAmt = 0;
    let adminChargeAmt = 0;

    for (const tx of items) {
      const type = (tx.transType || '').toLowerCase();
      const amount = Math.abs(tx.amount);

      if (type.includes('level')) {
        level += amount;
        creditIn += amount;
        balance += amount;
      } else if (type.includes('direct')) {
        direct += amount;
        creditIn += amount;
        balance += amount;
      } else if (type.includes('deposit')) {
        deposit += amount;
        creditIn += amount;
        balance += amount;
      } else if (type.includes('deduct')) {
        deduct += amount;
        creditOut += amount;
        balance -= amount;
      } else if (type.includes('tds') || type.includes('tax')) {
        tdsAmt += amount;
        creditOut += amount;
        balance -= amount;
      } else if (type.includes('admincharge') || type.includes('admin_charge') || type.includes('admin charge')) {
        adminChargeAmt += amount;
        creditOut += amount;
        balance -= amount;
      } else if (type.includes('lock')) {
        lock += amount;
      } else if (tx.amount >= 0) {
        creditIn += amount;
        balance += amount;
      } else {
        creditOut += amount;
        balance -= amount;
      }
    }

    this.levelIncome.set(level);
    this.directIncome.set(direct);
    this.depositByAdmin.set(deposit);
    this.deductByAdmin.set(deduct);
    this.tds.set(tdsAmt);
    this.adminCharge.set(adminChargeAmt);
    this.totalInAmount.set(creditIn);
    this.totalOutAmount.set(creditOut);
    this.lockAmount.set(lock);
    this.availableBalance.set(balance);
    this.ledgerBalance.set(balance);
  }
}

interface TransactionItem {
  id: number;
  transType: string;
  remark: string;
  amount: number;
  transDate: string;
}
