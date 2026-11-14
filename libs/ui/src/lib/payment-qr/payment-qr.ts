import { Component, input, effect, signal, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-payment-qr',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div [class]="compact() ? 'pqr-card pqr-card--sm' : 'pqr-card'">
        <div class="pqr-spinner"><div class="pqr-spinner__ring"></div></div>
        <p class="pqr-spinner__text">Generating QR Code...</p>
      </div>
    }
    @if (errorMessage()) {
      <div [class]="compact() ? 'pqr-card pqr-card--sm pqr-error' : 'pqr-card pqr-error'">
        <div class="pqr-error__icon"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="pqr-error__text">{{ errorMessage() }}</p>
        <button class="pqr-error__retry" (click)="generateQr()"><i class="fa fa-refresh mr-1"></i> Retry</button>
      </div>
    }
    @if (!isLoading() && !errorMessage() && qrDataUrl()) {
      <div [class]="compact() ? 'pqr-card pqr-card--sm' : 'pqr-card'">
        <div [class]="compact() ? 'pqr-header pqr-header--sm' : 'pqr-header'">
          <div [class]="compact() ? 'pqr-header__icon pqr-header__icon--sm' : 'pqr-header__icon'"><i class="fa fa-qrcode"></i></div>
          <span [class]="compact() ? 'pqr-header__text pqr-header__text--sm' : 'pqr-header__text'">UPI Payment</span>
        </div>
        <div [class]="compact() ? 'pqr-img-wrap pqr-img-wrap--sm' : 'pqr-img-wrap'">
          <img [src]="qrDataUrl()" alt="UPI QR Code" [class]="compact() ? 'pqr-img pqr-img--sm' : 'pqr-img'" />
        </div>
        @if (!compact()) {
          <div class="pqr-info">
            <div class="pqr-info__row"><span class="pqr-info__label">Merchant</span><span class="pqr-info__value pqr-info__value--name">{{ merchantName() }}</span></div>
            <div class="pqr-info__divider"></div>
            <div class="pqr-info__row"><span class="pqr-info__label">UPI ID</span><span class="pqr-info__value pqr-info__value--upi">{{ upiId() }}</span></div>
            <div class="pqr-info__divider"></div>
            <div class="pqr-info__row"><span class="pqr-info__label">Amount</span><span class="pqr-info__value pqr-info__value--amt">{{ formattedAmount() }}</span></div>
          </div>
        }
        @if (compact()) {
          <div class="pqr-badge">{{ formattedAmount() }}</div>
        }
        <div [class]="compact() ? 'pqr-footer pqr-footer--sm' : 'pqr-footer'">
          <i class="fa fa-mobile pqr-footer__icon"></i>
          <span>Scan any UPI App to Pay</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .pqr-card { display:flex; flex-direction:column; align-items:center; width:100%; max-width:340px; margin:0 auto; background:#fff; border-radius:1rem; box-shadow:0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06); overflow:hidden; font-family:'DM Sans',system-ui,sans-serif; }
    .pqr-card--sm { max-width:280px; border-radius:.75rem; }
    .pqr-spinner { display:flex; align-items:center; justify-content:center; padding:2.5rem; }
    .pqr-spinner__ring { width:36px; height:36px; border:3px solid #e5e7eb; border-top-color:#06b6d4; border-radius:50%; animation:pqr-spin .8s linear infinite; }
    @keyframes pqr-spin { to { transform:rotate(360deg); } }
    .pqr-spinner__text { margin:0 0 1.25rem; font-size:.8125rem; color:#6b7280; }
    .pqr-error { padding:1.5rem 1.25rem; gap:.625rem; }
    .pqr-error__icon { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:#fef2f2; color:#ef4444; font-size:1.1rem; }
    .pqr-error__text { margin:0; font-size:.8125rem; color:#6b7280; text-align:center; }
    .pqr-error__retry { display:inline-flex; align-items:center; gap:.25rem; margin-top:.5rem; padding:.4rem 1rem; font-size:.75rem; font-weight:600; color:#fff; background:#06b6d4; border:none; border-radius:.5rem; cursor:pointer; transition:background .15s; }
    .pqr-error__retry:hover { background:#0891b2; }
    .pqr-header { display:flex; align-items:center; gap:.5rem; width:100%; padding:.875rem 1.125rem; background:linear-gradient(135deg,#06b6d4,#0891b2); }
    .pqr-header--sm { padding:.625rem .875rem; gap:.375rem; }
    .pqr-header__icon { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:.4rem; background:rgba(255,255,255,.2); color:#fff; font-size:.875rem; }
    .pqr-header__icon--sm { width:22px; height:22px; font-size:.7rem; }
    .pqr-header__text { font-size:.875rem; font-weight:700; color:#fff; letter-spacing:.01em; }
    .pqr-header__text--sm { font-size:.75rem; }
    .pqr-img-wrap { display:flex; align-items:center; justify-content:center; padding:1.25rem 1.125rem .75rem; }
    .pqr-img-wrap--sm { padding:.75rem .75rem .5rem; }
    .pqr-img { width:250px; height:250px; border-radius:.625rem; border:1px solid #f3f4f6; object-fit:contain; }
    .pqr-img--sm { width:200px; height:200px; border-radius:.5rem; }
    .pqr-info { width:100%; padding:0 1.125rem; }
    .pqr-info__row { display:flex; align-items:center; justify-content:space-between; padding:.5rem 0; }
    .pqr-info__divider { height:1px; background:#f3f4f6; }
    .pqr-info__label { font-size:.75rem; color:#9ca3af; font-weight:500; }
    .pqr-info__value { font-size:.8125rem; color:#111827; font-weight:600; text-align:right; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pqr-info__value--name { color:#1f2937; }
    .pqr-info__value--upi { color:#0891b2; font-family:'SF Mono','Fira Code',monospace; font-size:.75rem; }
    .pqr-info__value--amt { color:#059669; font-size:.9375rem; font-weight:700; }
    .pqr-badge { padding:.25rem .75rem; margin:.125rem 0 .25rem; font-size:.75rem; font-weight:700; color:#059669; background:#ecfdf5; border-radius:2rem; }
    .pqr-footer { display:flex; align-items:center; justify-content:center; gap:.375rem; width:100%; padding:.75rem 1rem; margin-top:.5rem; background:#f0fdfa; border-top:1px solid #e0f2fe; font-size:.75rem; font-weight:600; color:#0891b2; letter-spacing:.01em; }
    .pqr-footer--sm { padding:.5rem .75rem; font-size:.6875rem; margin-top:.25rem; }
    .pqr-footer__icon { font-size:1rem; }
    .pqr-footer--sm .pqr-footer__icon { font-size:.8rem; }
    @media (max-width:400px) { .pqr-card { max-width:100%; border-radius:.75rem; } .pqr-card--sm { max-width:240px; } .pqr-img { width:200px; height:200px; } .pqr-img--sm { width:180px; height:180px; } }
  `],
})
export class PaymentQrComponent implements OnInit {
  readonly upiId = input.required<string>();
  readonly merchantName = input.required<string>();
  readonly amount = input.required<number>();
  readonly transactionNote = input('');
  readonly compact = input(false);

  readonly qrDataUrl = signal<string>('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const upi = this.upiId();
      const name = this.merchantName();
      const amt = this.amount();
      if (upi && name && amt > 0) this.generateQr();
    });
  }

  ngOnInit(): void {
    if (this.upiId() && this.merchantName() && this.amount() > 0) this.generateQr();
  }

  readonly formattedAmount = (): string => `\u20B9${(this.amount() ?? 0).toFixed(2)}`;

  async generateQr(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.qrDataUrl.set('');
    this.cdr.markForCheck();
    try {
      const uri = `upi://pay?pa=${encodeURIComponent(this.upiId())}&pn=${encodeURIComponent(this.merchantName())}&am=${(this.amount() ?? 0).toFixed(2)}&cu=INR${this.transactionNote() ? '&tn=' + encodeURIComponent(this.transactionNote()) : ''}`;
      this.qrDataUrl.set(await QRCode.toDataURL(uri, { width: this.compact() ? 200 : 250, margin: 1, color: { dark: '#111827', light: '#ffffff' }, errorCorrectionLevel: 'M' }));
    } catch {
      this.errorMessage.set('Failed to generate QR code. Please try again.');
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }
}
