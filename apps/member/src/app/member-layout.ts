import { Component } from '@angular/core';
import { APP_NAME, FEATURES } from '@org/constants';
import { AppLayoutComponent, SidebarNavItem, DASHBOARD_ICON, PROFILE_ICON, MEMBERS_ICON, ORDERS_ICON, TREE_ICON, REFERRAL_ICON } from '@org/layout';

@Component({
  selector: 'app-member-layout',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `
    <app-layout
      [navItems]="navItems"
      [brandName]="appName"
      appSubtitle="Member Portal"
      title="My Account"
      homeRoute="/"
      [showFooter]="true"
    />
  `,
})
export class MemberLayoutComponent {
  readonly appName = APP_NAME;

  /** Menu shown today: the screens of modules whose new API exists. */
  private readonly iamNavItems: SidebarNavItem[] = [
    { name: 'Dashboard', icon: DASHBOARD_ICON, section: 'MAIN', path: '/' },
  ];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
  ];
}
