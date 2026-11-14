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

  /** Menu of the previous product: kept in code, linked only while FEATURES.legacyModules is on. */
  private readonly legacyNavItems: SidebarNavItem[] = [
    {
      name: 'Dashboard',
      icon: DASHBOARD_ICON,
      section: 'MAIN',
      path: '/',
    },
    {
      name: 'Profile Manager',
      icon: PROFILE_ICON,
      subItems: [
        { name: 'View Profile', path: '/view-profile' },
        { name: 'Edit Profile', path: '/settings/edit-profile' },
        { name: 'Welcome Letter', path: '/settings/welcome-letter' },
        { name: 'Documents', path: '/documents' },
      ],
    },
    {
      name: 'Members',
      icon: MEMBERS_ICON,
      section: 'MAIN',
      subItems: [
        { name: 'List', path: '/members/list' },
        { name: 'Sponsor New', path: '/sponsor-new' },
      ],
    },
    {
      name: 'Recent Orders',
      icon: ORDERS_ICON,
      section: 'MAIN',
      subItems: [
        { name: 'New Order', path: '/course/new' },
        { name: 'Order List', path: '/course/list' },
      ],
    },
    {
      name: 'Network Manager',
      icon: TREE_ICON,
      section: 'NETWORK',
      subItems: [
        { name: 'Genealogy', path: '/genealogy' },
      ],
    },
    {
      name: 'Referral Link',
      icon: REFERRAL_ICON,
    },
  ];

  /** Menu shown today: the screens of modules whose new API exists. */
  private readonly iamNavItems: SidebarNavItem[] = [
    { name: 'Dashboard', icon: DASHBOARD_ICON, section: 'MAIN', path: '/' },
  ];

  readonly navItems: SidebarNavItem[] = [
    ...(FEATURES.iam ? this.iamNavItems : []),
    ...(FEATURES.legacyModules ? this.legacyNavItems : []),
  ];
}
