import { Route } from '@angular/router';
import { AccessDeniedComponent } from '@org/ui';
import { appRoleGuard, authGuard, mustChangePasswordGuard, roleGuard } from '@org/guards';
import { ADMIN_ROUTES } from '@org/constants';
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
        loadComponent: () => import('@org/layout').then((m) => m.WelcomeComponent),
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
      { path: '', pathMatch: 'full', redirectTo: stripPrefix(ADMIN_ROUTES.DASHBOARD) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
