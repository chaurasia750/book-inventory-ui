import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyInvoiceIdentity, CompanyProfile } from '@org/shared-models';
import { ButtonComponent, SkeletonLoaderComponent, injectRouteParam } from '@org/ui';
import { SessionCutOffsComponent } from '../sales/session-cut-offs';
import { CompanyBankFormComponent } from './company-bank-form';
import { CompanyDetailsFormComponent } from './company-details-form';
import { CompanyImagesComponent } from './company-images';
import { CompanyInvoiceSettingsComponent } from './company-invoice-settings';

type CompanyTab = 'details' | 'images' | 'bank' | 'settings' | 'cutoffs';

/**
 * The Company profile screen (company spec R17-R21, the owner's request "company settings"): under SETTINGS for the Owner. One page
 * with the company's details (address, contact, GSTIN, PAN, tagline), the logo and the signature, the one bank account and the invoice
 * settings (terms, footer, print GSTIN); every section saves on its own. Staff do not see it.
 */
@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [NgClass, RouterLink, TranslatePipe, ButtonComponent, SkeletonLoaderComponent, CompanyDetailsFormComponent, CompanyImagesComponent, CompanyBankFormComponent, CompanyInvoiceSettingsComponent, SessionCutOffsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (loading()) {
        <div class="space-y-2 rounded-[10px] border border-neutral-200 bg-white p-4"><app-skeleton-loader width="40%" /><app-skeleton-loader width="100%" /><app-skeleton-loader width="80%" /></div>
      } @else if (id() && profile() && identity(); as ident) {
        <section class="flex flex-col gap-1 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <h1 class="m-0 text-xl font-semibold text-primary-fg">{{ profile()!.name }}</h1>
          <p class="m-0 text-xs text-gray-500">{{ 'companyProfile.title' | translate }} · {{ 'companyProfile.subtitle' | translate }}</p>
        </section>

        <section class="overflow-hidden rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex gap-6 overflow-x-auto border-b border-neutral-200 px-4 dark:border-charcoal-700" role="tablist">
            @for (t of tabs; track t) {
              <a role="tab" [routerLink]="tabLink(t)" [attr.aria-selected]="tab() === t"
                class="-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors"
                [ngClass]="tab() === t ? 'border-gold-500 text-primary-fg' : 'border-transparent text-gray-500 hover:text-primary-fg'">{{ 'companyProfile.tabs.' + t | translate }}</a>
            }
          </div>
          <div class="p-4">
            @switch (tab()) {
              @case ('details') { <app-company-details-form [companyId]="id()" [profile]="profile()!" /> }
              @case ('images') { <app-company-images [companyId]="id()" [logoUrl]="ident.logoUrl" [signatureUrl]="ident.signatureUrl" /> }
              @case ('bank') { <app-company-bank-form [companyId]="id()" [bank]="ident.bank" /> }
              @case ('settings') { <app-company-invoice-settings [companyId]="id()" [settings]="ident.invoice" /> }
              @case ('cutoffs') { <app-session-cut-offs /> }
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class CompanyProfileComponent {
  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  /** One section at a time (the owner: the last two cards were far below the first two). */
  readonly tabs: readonly CompanyTab[] = ['details', 'images', 'bank', 'settings', 'cutoffs'];
  /** Platform U16: the section is the `tab` of the address (`/company-profile/bank`), so it can be linked; no section in the address is the details. */
  private readonly routeTab = injectRouteParam('tab');
  readonly tab = computed<CompanyTab>(() => this.tabs.find((t) => t === this.routeTab()) ?? 'details');
  /** The address of a section of the Company profile (the details are the profile's own address). */
  tabLink(tab: CompanyTab): string[] {
    return tab === 'details' ? ['/company-profile'] : ['/company-profile', tab];
  }

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
