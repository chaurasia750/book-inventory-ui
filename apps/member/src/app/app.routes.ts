import { Route } from '@angular/router';
import { FEATURES } from '@org/constants';
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
    loadComponent: () =>
      import('@org/member-feature-dashboard').then((m) => m.DashboardShellComponent),
    canActivate: [authGuard, roleGuard(['member', 'admin']), mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          FEATURES.legacyModules
            ? import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent)
            : import('@org/layout').then((m) => m.WelcomeComponent),
      },
      {
        path: 'my-team',
        loadComponent: () =>
          import('@org/member-feature-dashboard').then((m) => m.MyTeamShellComponent),
      },
      {
        path: 'income',
        loadComponent: () =>
          import('@org/member-feature-dashboard').then((m) => m.IncomeComponent),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('@org/member-feature-dashboard').then((m) => m.WalletComponent),
      },
      {
        path: 'course',
        loadComponent: () =>
          import('./pages/order-list/order-list').then((m) => m.OrderListComponent),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./pages/subscription/subscription-page.component').then((m) => m.SubscriptionPageComponent),
      },
      {
        path: 'withdrawal',
        loadComponent: () =>
          import('@org/member-feature-dashboard').then((m) => m.WithdrawalComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('@org/member-feature-dashboard').then((m) => m.DocumentsUploadComponent),
      },
      {
        path: 'sponsor-new',
        loadComponent: () =>
          import('./pages/sponsor-new/sponsor-new').then((m) => m.SponsorNewComponent),
      },
      {
        path: 'course/new',
        loadComponent: () =>
          import('./pages/new-order/new-order').then((m) => m.NewOrderComponent),
      },
      {
        path: 'course/detail/:id',
        loadComponent: () =>
          import('./pages/order-detail/order-detail').then((m) => m.MemberOrderDetailComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then((m) => m.SettingsComponent),
        children: [
          { path: '', redirectTo: 'edit-profile', pathMatch: 'full' },
          {
            path: 'edit-profile',
            loadComponent: () =>
              import('./pages/edit-profile/edit-profile').then((m) => m.EditProfileComponent),
          },
          {
            path: 'welcome-letter',
            loadComponent: () =>
              import('./pages/welcome-letter/welcome-letter').then(
                (m) => m.WelcomeLetterComponent,
              ),
          },
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
              import('./pages/change-password/change-password').then(
                (m) => m.ChangePasswordComponent,
              ),
          },
          {
            path: 'bank-account',
            loadComponent: () =>
              import('./pages/bank-account/bank-account').then(
                (m) => m.BankAccountComponent,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '',
    component: MemberLayoutComponent,
    canActivate: [authGuard, roleGuard(['member', 'admin']), mustChangePasswordGuard],
    children: [
      {
        path: 'view-profile',
        loadComponent: () =>
          import('./pages/view-profile/view-profile').then((m) => m.ViewProfileComponent),
      },
      {
        path: 'members/list',
        loadComponent: () =>
          import('./pages/members-list/members-list').then((m) => m.MembersListComponentPage),
      },
      {
        path: 'sponsor-new',
        loadComponent: () =>
          import('./pages/sponsor-new/sponsor-new').then((m) => m.SponsorNewComponent),
      },
      {
        path: 'course/new',
        loadComponent: () =>
          import('./pages/new-order/new-order').then((m) => m.NewOrderComponent),
      },
      {
        path: 'course/list',
        loadComponent: () =>
          import('./pages/order-list/order-list').then((m) => m.OrderListComponent),
      },
      {
        path: 'course/detail/:id',
        loadComponent: () =>
          import('./pages/order-detail/order-detail').then((m) => m.MemberOrderDetailComponent),
      },
      {
        path: 'genealogy',
        loadComponent: () =>
          import('./pages/genealogy/genealogy').then((m) => m.GenealogyComponent),
      },
      {
        path: 'referral-link',
        loadComponent: () =>
          import('./pages/referral-link/referral-link').then((m) => m.ReferralLinkComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
