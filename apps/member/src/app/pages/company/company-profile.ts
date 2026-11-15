import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyInvoiceIdentity, CompanyProfile } from '@org/shared-models';
import { ButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { CompanyBankFormComponent } from './company-bank-form';
import { CompanyDetailsFormComponent } from './company-details-form';
import { CompanyImagesComponent } from './company-images';
import { CompanyInvoiceSettingsComponent } from './company-invoice-settings';

type CompanyTab = 'details' | 'images' | 'bank' | 'settings';

/**
 * The Company profile screen (company spec R17-R21, the owner's request "company settings"): under SETTINGS for the Owner. One page
 * with the company's details (address, contact, GSTIN, PAN, tagline), the logo and the signature, the one bank account and the invoice
 * settings (terms, footer, print GSTIN); every section saves on its own. Staff do not see it.
 */
@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [NgClass, TranslatePipe, ButtonComponent, SkeletonLoaderComponent, CompanyDetailsFormComponent, CompanyImagesComponent, CompanyBankFormComponent, CompanyInvoiceSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div>
        <h1 class="text-2xl font-bold text-primary-fg">{{ 'companyProfile.title' | translate }}</h1>
        <p class="mt-0.5 text-sm text-gray-500">{{ 'companyProfile.subtitle' | translate }}</p>
      </div>
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (loading()) {
        <div class="space-y-2 rounded-[10px] border border-neutral-200 bg-white p-4"><app-skeleton-loader width="40%" /><app-skeleton-loader width="100%" /><app-skeleton-loader width="80%" /></div>
      } @else if (id() && profile() && identity(); as ident) {
        <div class="flex gap-6 overflow-x-auto border-b border-neutral-200 dark:border-charcoal-700" role="tablist">
          @for (t of tabs; track t) {
            <button type="button" role="tab" (click)="tab.set(t)" [attr.aria-selected]="tab() === t"
              class="-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors"
              [ngClass]="tab() === t ? 'border-gold-500 text-primary-fg' : 'border-transparent text-gray-500 hover:text-primary-fg'">{{ 'companyProfile.tabs.' + t | translate }}</button>
          }
        </div>
        @switch (tab()) {
          @case ('details') { <app-company-details-form [companyId]="id()" [profile]="profile()!" /> }
          @case ('images') { <app-company-images [companyId]="id()" [logoUrl]="ident.logoUrl" [signatureUrl]="ident.signatureUrl" /> }
          @case ('bank') { <app-company-bank-form [companyId]="id()" [bank]="ident.bank" /> }
          @case ('settings') { <app-company-invoice-settings [companyId]="id()" [settings]="ident.invoice" /> }
        }
      }
    </div>
  `,
})
export class CompanyProfileComponent {
  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  /** One section at a time (the owner: the last two cards were far below the first two). */
  readonly tabs: readonly CompanyTab[] = ['details', 'images', 'bank', 'settings'];
  readonly tab = signal<CompanyTab>('details');
  readonly id = signal('');
  readonly profile = signal<CompanyProfile | null>(null);
  readonly identity = signal<CompanyInvoiceIdentity | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ current: this.companies.current(), profile: this.companies.profile(), identity: this.companies.invoiceIdentity() }).subscribe({
      next: (r) => {
        this.id.set(r.current.company?.id ?? '');
        this.profile.set(r.profile);
        this.identity.set(r.identity);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
