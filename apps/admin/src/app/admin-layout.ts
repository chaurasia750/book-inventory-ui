import { Component, inject } from '@angular/core';
import { AuthService } from '@org/auth';
import { APP_NAME, FEATURES } from '@org/constants';
import { CompanyPickerComponent } from './components/company-picker';
import { AppLayoutComponent, SidebarNavItem, DASHBOARD_ICON, TREE_ICON, MEMBERS_ICON, SETTINGS_ICON } from '@org/layout';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AppLayoutComponent, CompanyPickerComponent],
  template: `
    <app-layout
      [navItems]="navItems"
      [brandName]="appName"
      appSubtitle="Administration Console"
      title="Admin Console"
      homeRoute="/dashboard"
    >
      @if (isSuperAdmin) {
        <app-company-picker headerExtra />
      }
    </app-layout>
  `,
})
export class AdminLayoutComponent {
  readonly appName = APP_NAME;
  private readonly auth = inject(AuthService);

  /** R13: only the Super Admin can enter a company. */
  readonly isSuperAdmin = this.auth.hasAppRole('SUPER_ADMIN');

  /** Menu shown today: the screens of modules whose new API exists. */
  private readonly iamNavItems: SidebarNavItem[] = [
    { name: 'Dashboard', icon: DASHBOARD_ICON, section: 'MAIN', path: '/dashboard' },
  ];

  /** Account management is Super Admin only (spec R27); the route is guarded the same way. */
  private readonly superAdminNavItems: SidebarNavItem[] = [
    { name: 'Companies', icon: TREE_ICON, section: 'MANAGEMENT', path: '/companies' },
    { name: 'Users', icon: MEMBERS_ICON, section: 'MANAGEMENT', path: '/users' },
    { name: 'Login log', icon: SETTINGS_ICON, section: 'LOGS', path: '/login-logs' },
    { name: 'Audit log', icon: SETTINGS_ICON, section: 'LOGS', path: '/audit-logs' },
  ];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
    ...(FEATURES.iam && this.auth.hasAppRole('SUPER_ADMIN') ? this.superAdminNavItems : []),
  ];
}
