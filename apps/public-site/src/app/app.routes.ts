import { Route } from '@angular/router';
import { AuthLayoutComponent } from '@org/layout';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '@org/constants';
import { stripAppRoutePrefix as stripAuthPrefix } from '@org/shared-utils';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: PUBLIC_ROUTES.WELCOME,
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/auth/welcome/welcome').then((m) => m.WelcomeComponent),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: stripAuthPrefix(AUTH_ROUTES.FORGOT_PASSWORD),
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: stripAuthPrefix(AUTH_ROUTES.RESET_PASSWORD),
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },
  { path: PUBLIC_ROUTES.HOME, pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'error/unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: 'error/invalid-role',
    loadComponent: () =>
      import('./pages/invalid-role/invalid-role.component').then((m) => m.InvalidRoleComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
