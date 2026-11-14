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
        // The user opens beside the list (platform U10); the id is the child route.
        children: [{ path: ':id', children: [] }],
      },
      {
        path: 'companies',
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('./pages/companies/company-list').then((m) => m.CompanyListComponent),
        // The company opens beside the list (platform U10); the id is the child route.
        children: [{ path: ':id', children: [] }],
      },
      {
        path: stripPrefix(ADMIN_ROUTES.PROFILE),
        loadComponent: () => import('./pages/account/account-pages').then((m) => m.ProfilePageComponent),
      },
      {
        path: stripPrefix(ADMIN_ROUTES.AUDIT_LOGS),
        canActivate: [appRoleGuard(['SUPER_ADMIN'])],
        loadComponent: () => import('@org/layout').then((m) => m.AuditLogScreenComponent),
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
