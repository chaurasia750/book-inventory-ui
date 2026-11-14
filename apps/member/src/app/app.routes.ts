import { Route } from '@angular/router';
import { AccessDeniedComponent } from '@org/ui';
import { authGuard, mustChangePasswordGuard, roleGuard } from '@org/guards';
import { MemberLayoutComponent } from './member-layout';

export const appRoutes: Route[] = [
  {
    path: 'unauthorized',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    component: MemberLayoutComponent,
    canActivate: [authGuard, roleGuard(['member', 'admin']), mustChangePasswordGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('@org/layout').then((m) => m.WelcomeComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then((m) => m.SettingsComponent),
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            loadComponent: () => import('./pages/account/account-pages').then((m) => m.ProfilePageComponent),
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
              import('./pages/change-password/change-password').then((m) => m.ChangePasswordComponent),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
