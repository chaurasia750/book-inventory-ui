import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@org/auth';
import { CompanyService } from '@org/api-services';
import { APP_NAME, FEATURES } from '@org/constants';
import { AppLayoutComponent, SidebarNavItem, DASHBOARD_ICON, MEMBERS_ICON, SETTINGS_ICON, TREE_ICON } from '@org/layout';

/** Shown in the header while the company of the session is being read. */
const LOADING_SUBTITLE = '...';

/**
 * The company workspace (iam spec R60, company spec R10): the header shows the name of the company of this session,
 * read once from `companies/current`. While it loads a placeholder is shown; if it cannot be read the header shows the
 * app name only. The Owner also gets the Staff menu (iam R65-R67); Staff and everyone else do not.
 */
@Component({
  selector: 'app-member-layout',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `
    <app-layout
      [navItems]="navItems"
      [brandName]="appName"
      [appSubtitle]="subtitle()"
      title="My Account"
      homeRoute="/"
      [showFooter]="true"
    />
  `,
})
export class MemberLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly companies = inject(CompanyService);

  readonly appName = APP_NAME;
  readonly subtitle = signal(LOADING_SUBTITLE);

  /** Menu shown today: the screens of modules whose new API exists. */
  private readonly iamNavItems: SidebarNavItem[] = [
    { name: 'Dashboard', icon: DASHBOARD_ICON, section: 'MAIN', path: '/' },
  ];

  /** Finance spec R13: the ledger is the Owner's only, in its own menu group. */
  private readonly ledgerNavItems: SidebarNavItem[] = [{ name: 'Ledger', icon: SETTINGS_ICON, section: 'LEDGER', path: '/ledger' }];

  /**
   * Item spec R9, price spec R5, stock spec R10: the Owner and Staff both see the items, their prices and their stock (Staff
   * read-only, without purchase prices), as one "Items" menu with three entries (owner's request, 2026-11-15).
   */
  private readonly itemNavItems: SidebarNavItem[] = [
    {
      name: 'Items',
      icon: SETTINGS_ICON,
      section: 'ITEMS',
      subItems: [
        { name: 'Item list', path: '/items' },
        { name: 'Prices', path: '/prices' },
        { name: 'Stock', path: '/stock' },
      ],
    },
  ];

  /** Vendor spec R8: vendors are the Owner's; Staff have no access. */
  private readonly vendorNavItems: SidebarNavItem[] = [{ name: 'Vendors', icon: TREE_ICON, section: 'VENDORS', path: '/vendors' }];

  /** R66: the Owner manages the Staff of their own company and reads the audit log of it (core A7). */
  private readonly ownerNavItems: SidebarNavItem[] = [
    { name: 'Staff', icon: MEMBERS_ICON, section: 'TEAM', path: '/staff' },
    { name: 'Audit log', icon: SETTINGS_ICON, section: 'LOGS', path: '/audit' },
  ];

  /** School spec R9, R11: the Owner and Staff both see the company's schools (Staff read-only). Schools and vendors each have their own menu group (their ledgers join them later). */
  private readonly schoolNavItems: SidebarNavItem[] = [{ name: 'Schools', icon: TREE_ICON, section: 'SCHOOLS', path: '/schools' }];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
    ...(this.auth.hasAppRole('OWNER') || this.auth.hasAppRole('STAFF') ? this.schoolNavItems : []),
    ...(this.auth.hasAppRole('OWNER') || this.auth.hasAppRole('STAFF') ? this.itemNavItems : []),
    ...(this.auth.hasAppRole('OWNER') ? this.vendorNavItems : []),
    ...(this.auth.hasAppRole('OWNER') ? this.ledgerNavItems : []),
    ...(this.auth.hasAppRole('OWNER') ? this.ownerNavItems : []),
  ];

  constructor() {
    this.companies.current().subscribe({
      next: (view) => this.subtitle.set(view.company?.name ?? ''),
      error: () => this.subtitle.set(''),
    });
  }
}
