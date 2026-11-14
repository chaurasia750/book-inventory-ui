import { Route } from '@angular/router';
import { AccessDeniedComponent } from '@org/ui';
import { appRoleGuard, authGuard, mustChangePasswordGuard, roleGuard } from '@org/guards';
import { ADMIN_ROUTES, FEATURES } from '@org/constants';
import { stripAppRoutePrefix as stripPrefix } from '@org/shared-utils';
import { AdminLayoutComponent } from './admin-layout';


export const appRoutes: Route[] = [
  {
    path: 'unauthorized',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard(['admin']), mustChangePasswordGuard],
    children: [
      {
        path: stripPrefix(ADMIN_ROUTES.DASHBOARD),
        loadComponent: () =>
          FEATURES.legacyModules
            ? import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent)
            : import('@org/layout').then((m) => m.WelcomeComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.USERS),
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () =>
          import('./pages/user-management/user-management').then((m) => m.UserManagementComponent),
      },
      {
        path: `${stripPrefix(ADMIN_ROUTES.USERS)}/:id`,
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('./pages/user-detail/user-detail').then((m) => m.UserDetailComponent),
      },
      {
        path: 'members/list',
        loadComponent: () =>
          import('./pages/members-list/members-list').then((m) => m.AdminMembersListPageComponent),
      },
      {
        path: 'members/:memberId/details',
        loadComponent: () =>
          import('./pages/members-detail/member-profile-page.component').then((m) => m.MemberProfilePageComponent),
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          {
            path: 'overview',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberOverviewComponent),
          },
          {
            path: 'network',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberNetworkComponent),
          },
          {
            path: 'income',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberIncomeComponent),
          },
          {
            path: 'wallet',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberWalletComponent),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberOrdersComponent),
          },
          {
            path: 'kyc',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberKycComponent),
          },
          {
            path: 'documents',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberDocumentsComponent),
          },
          {
            path: 'timeline',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberTimelineComponent),
          },
          {
            path: 'activity',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberActivityComponent),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('@org/member-detail').then((m) => m.MemberSettingsComponent),
          },
        ],
      },
      {
        path: stripPrefix(ADMIN_ROUTES.ROLES),
        loadComponent: () =>
          import('./pages/role-permission-management/role-permission-management').then(
            (m) => m.RolePermissionManagementComponent
          ),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.SETTINGS),
        loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.PROFILE),
        loadComponent: () => import('./pages/account/account-pages').then((m) => m.ProfilePageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.NOTIFICATIONS),
        loadComponent: () =>
          import('./pages/notifications/notifications').then((m) => m.NotificationsComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.AUDIT_LOGS),
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('./pages/audit-logs/audit-logs').then((m) => m.AuditLogsComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.REPORTS),
        loadComponent: () => import('./pages/reports/reports').then((m) => m.ReportsComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.ACTIVITY_LOGS),
        loadComponent: () =>
          import('./pages/activity-logs/activity-logs').then((m) => m.ActivityLogsComponent),
      },
      {
        path: 'master/country',
        loadComponent: () =>
          import('./pages/master/country/country-list').then((m) => m.CountryListComponent),
      },
      {
        path: 'master/state',
        loadComponent: () =>
          import('./pages/master/state/state-list').then((m) => m.StateListComponent),
      },
      {
        path: 'master/district',
        loadComponent: () =>
          import('./pages/master/district/district-list').then((m) => m.DistrictListComponent),
      },
      {
        path: 'master/city',
        loadComponent: () =>
          import('./pages/master/city/city-list').then((m) => m.CityListComponent),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./pages/withdrawals/admin-withdrawals.component').then(
            (m) => m.AdminWithdrawalsComponent,
          ),
      },
      {
        path: 'sponsor-new',
        loadComponent: () =>
          import('./pages/sponsor-new/sponsor-new').then((m) => m.AdminSponsorNewComponent),
      },
      {
        path: 'login-logs',
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('./pages/login-logs/login-logs').then((m) => m.LoginLogsComponent),
      },
      {
        path: 'sessions',
        loadComponent: () => import('./pages/account/account-pages').then((m) => m.SessionsPageComponent),
      },
      {
        path: 'login-history',
        loadComponent: () => import('./pages/account/account-pages').then((m) => m.LoginHistoryPageComponent),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password').then(
            (m) => m.AdminChangePasswordPageComponent
          ),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.ORDERS),
        loadComponent: () =>
          import('./pages/order-list/order-list').then(
            (m) => m.AdminOrderListComponent
          ),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.ORDER_DETAIL),
        loadComponent: () =>
          import('./pages/order-detail/order-detail').then(
            (m) => m.AdminOrderDetailComponent
          ),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.TREE_GENEALOGY),
        loadComponent: () =>
          import('./pages/tree-visualization/genealogy-tree-page').then(
            (m) => m.AdminGenealogyTreePageComponent
          ),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_DASHBOARD),
        loadComponent: () =>
          import('./pages/leads/leads-page').then((m) => m.AdminLeadsPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_LIST),
        loadComponent: () =>
          import('./pages/leads/leads-list-page').then((m) => m.AdminLeadsListPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_ADD),
        loadComponent: () =>
          import('./pages/leads/leads-add-page').then((m) => m.AdminLeadsAddPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_DETAIL),
        loadComponent: () =>
          import('./pages/leads/leads-detail-page').then((m) => m.AdminLeadsDetailPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_EDIT),
        loadComponent: () =>
          import('./pages/leads/leads-edit-page').then((m) => m.AdminLeadsEditPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.LEADS_CLOSING),
        loadComponent: () =>
          import('./pages/leads/leads-closing-page').then((m) => m.AdminLeadsClosingPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.INVENTORY_LIST),
        loadComponent: () =>
          import('./pages/inventory/inventory-list-page').then((m) => m.AdminInventoryListPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.INVENTORY_ADD),
        loadComponent: () =>
          import('./pages/inventory/inventory-add-page').then((m) => m.AdminInventoryAddPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.INVENTORY_DETAIL),
        loadComponent: () =>
          import('./pages/inventory/inventory-detail-page').then((m) => m.AdminInventoryDetailPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.INVENTORY_EDIT),
        loadComponent: () =>
          import('./pages/inventory/inventory-edit-page').then((m) => m.AdminInventoryEditPageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.VIDEO_MASTER),
        loadComponent: () =>
          import('./pages/video-master/video-master').then((m) => m.VideoMasterComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: stripPrefix(ADMIN_ROUTES.DASHBOARD) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
