import { Route } from '@angular/router';
import { AuthLayoutComponent, PublicLayoutComponent } from '@org/layout';
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
  {
    path: PUBLIC_ROUTES.HOME,
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
      },
      {
        path: PUBLIC_ROUTES.ABOUT,
        loadComponent: () =>
          import('./pages/about-us/about-us').then((m) => m.AboutUsComponent),
      },
      {
        path: PUBLIC_ROUTES.CONTACT,
        loadComponent: () =>
          import('./pages/contact-us/contact-us').then((m) => m.ContactUsComponent),
      },
      
      {
        path: PUBLIC_ROUTES.SERVICES,
        loadComponent: () =>
          import('./pages/services/services').then((m) => m.ServicesComponent),
      },
      {
        path: PUBLIC_ROUTES.FEATURES,
        loadComponent: () =>
          import('./pages/features/features').then((m) => m.FeaturesComponent),
      },
      {
        path: PUBLIC_ROUTES.PRICING,
        loadComponent: () =>
          import('./pages/pricing/pricing').then((m) => m.PricingComponent),
      },
      {
        path: PUBLIC_ROUTES.FAQ,
        loadComponent: () => import('./pages/faq/faq').then((m) => m.FaqComponent),
      },
      {
        path: PUBLIC_ROUTES.PRIVACY,
        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy').then(
            (m) => m.PrivacyPolicyComponent,
          ),
      },
      {
        path: PUBLIC_ROUTES.TERMS,
        loadComponent: () =>
          import('./pages/terms-conditions/terms-conditions').then(
            (m) => m.TermsConditionsComponent,
          ),
      },
      {
        path: PUBLIC_ROUTES.BLOG,
        loadComponent: () =>
          import('./pages/blog-listing/blog-listing').then((m) => m.BlogListingComponent),
      },
      {
        path: PUBLIC_ROUTES.BLOG_DETAIL,
        loadComponent: () =>
          import('./pages/blog-details/blog-details').then((m) => m.BlogDetailsComponent),
      },
      {
        path: PUBLIC_ROUTES.CAREERS,
        loadComponent: () =>
          import('./pages/careers/careers').then((m) => m.CareersComponent),
      },
    ],
  },
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
