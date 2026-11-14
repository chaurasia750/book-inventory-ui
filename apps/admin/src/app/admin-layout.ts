import { Component, inject } from '@angular/core';
import { AuthService } from '@org/auth';
import { APP_NAME, FEATURES } from '@org/constants';
import { AppLayoutComponent, SidebarNavItem, DASHBOARD_ICON, TREE_ICON, MEMBERS_ICON, SETTINGS_ICON } from '@org/layout';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `
    <app-layout
      [navItems]="navItems"
      [brandName]="appName"
      appSubtitle="Administration Console"
      title="Admin Console"
      homeRoute="/dashboard"
    />
  `,
})
export class AdminLayoutComponent {
  readonly appName = APP_NAME;
  private readonly auth = inject(AuthService);

  /** Menu of the previous product: kept in code, linked only while FEATURES.legacyModules is on. */
  private readonly legacyNavItems: SidebarNavItem[] = [
    {
      name: 'Dashboard',
      icon: DASHBOARD_ICON,
      section: 'MAIN',
      subItems: [
        { name: 'Overview', path: '/dashboard' },
        { name: 'All Orders', path: '/orders' },
        { name: 'Withdrawals', path: '/withdrawals' },
      ],
    },
    {
      name: 'Members',
      icon: MEMBERS_ICON,
      section: 'MANAGEMENT',
      subItems: [
        { name: 'List', path: '/members/list' },
        { name: 'Sponsor New', path: '/sponsor-new' },
      ],
    },
    {
      name: 'Network Manager',
      icon: TREE_ICON,
      section: 'MANAGEMENT',
      subItems: [
        { name: 'Binary Tree', path: '/tree/genealogy' },
      ],
    },
    {
      name: 'Settings',
      icon: SETTINGS_ICON,
      section: 'OTHER',
      subItems: [
        { name: 'Country', path: '/master/country' },
        { name: 'State', path: '/master/state' },
        { name: 'District', path: '/master/district' },
        { name: 'City', path: '/master/city' },
      ],
    },
  ];

  /** Menu shown today: the screens of modules whose new API exists. */
  private readonly iamNavItems: SidebarNavItem[] = [
    { name: 'Dashboard', icon: DASHBOARD_ICON, section: 'MAIN', path: '/dashboard' },
  ];

  /** Account management is Super Admin only (spec R27); the route is guarded the same way. */
  private readonly superAdminNavItems: SidebarNavItem[] = [
    { name: 'Users', icon: MEMBERS_ICON, section: 'MAIN', path: '/users' },
    { name: 'Login log', icon: SETTINGS_ICON, section: 'MAIN', path: '/login-logs' },
    { name: 'Audit log', icon: SETTINGS_ICON, section: 'MAIN', path: '/audit-logs' },
  ];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
    ...(FEATURES.iam && this.auth.hasAppRole('SUPER_ADMIN') ? this.superAdminNavItems : []),
    ...(FEATURES.legacyModules ? this.legacyNavItems : []),
  ];
}
