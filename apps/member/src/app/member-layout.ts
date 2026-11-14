import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@org/auth';
import { CompanyService } from '@org/api-services';
import { APP_NAME, FEATURES } from '@org/constants';
import { AppLayoutComponent, SidebarNavItem, DASHBOARD_ICON, MEMBERS_ICON } from '@org/layout';

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

  /** R66: the Owner manages the Staff of their own company and reads the audit log of it (core A7). */
  private readonly ownerNavItems: SidebarNavItem[] = [
    { name: 'Staff', icon: MEMBERS_ICON, section: 'MAIN', path: '/staff' },
    { name: 'Audit log', icon: DASHBOARD_ICON, section: 'MAIN', path: '/audit' },
  ];

  /** School spec R9, R11: the Owner and Staff both see the company's schools (Staff read-only). */
  private readonly schoolNavItems: SidebarNavItem[] = [{ name: 'Schools', icon: MEMBERS_ICON, section: 'MAIN', path: '/schools' }];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
    ...(this.auth.hasAppRole('OWNER') || this.auth.hasAppRole('STAFF') ? this.schoolNavItems : []),
    ...(this.auth.hasAppRole('OWNER') ? this.ownerNavItems : []),
  ];

  constructor() {
    this.companies.current().subscribe({
      next: (company) => this.subtitle.set(company.name),
      error: () => this.subtitle.set(''),
    });
  }
}
