import { Route } from '@angular/router';
import { AccessDeniedComponent } from '@org/ui';
import { appRoleGuard, authGuard, mustChangePasswordGuard, roleGuard } from '@org/guards';
import { companyAddressGuard } from './company-address';
import { MemberLayoutComponent } from './member-layout';

export const appRoutes: Route[] = [
  {
    path: 'unauthorized',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    component: MemberLayoutComponent,
    canActivate: [authGuard, roleGuard(['member', 'admin']), mustChangePasswordGuard, companyAddressGuard],
    // Runs again after the first navigation so a forced password change (which blocks the address lookup) is corrected afterwards.
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('@org/layout').then((m) => m.WelcomeComponent),
      },
      {
        path: 'audit',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('@org/layout').then((m) => m.AuditLogScreenComponent),
      },
      {
        path: 'staff',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('./pages/staff/staff-list').then((m) => m.StaffListComponent),
        // The Staff account opens beside the list (platform U10); the id is the child route.
        children: [{ path: ':id', children: [] }],
      },
      {
        // The bulk price change is the Owner's only; it sits before `prices` so `bulk` is not read as an item id (price#04).
        path: 'prices/bulk',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('./pages/prices/price-bulk').then((m) => m.PriceBulkComponent),
      },
      {
        path: 'prices',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/prices/price-list').then((m) => m.PriceListComponent),
        // An item's prices open beside the list (platform U10); the id is the item's.
        children: [{ path: ':id', children: [] }],
      },
      {
        path: 'stock',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/stock/stock-list').then((m) => m.StockListComponent),
        // An item's stock opens beside the list (platform U10); the id is the item's. Writing is the Owner's (the panel shows no forms to Staff).
        children: [{ path: ':id', children: [] }],
      },
      // Finance spec R11, R13: the Owner's ledger: outstanding schools and vendors (one route each); a party's statement opens beside the list (platform U10).
      { path: 'ledger', pathMatch: 'full', redirectTo: 'ledger/schools' },
      {
        path: 'ledger/schools',
        canActivate: [appRoleGuard(['OWNER'])],
        data: { party: 'schools' },
        loadComponent: () => import('./pages/ledger/outstanding-list').then((m) => m.OutstandingListComponent),
        children: [{ path: ':id', children: [] }],
      },
      {
        path: 'ledger/vendors',
        canActivate: [appRoleGuard(['OWNER'])],
        data: { party: 'vendors' },
        loadComponent: () => import('./pages/ledger/outstanding-list').then((m) => m.OutstandingListComponent),
        children: [{ path: ':id', children: [] }],
      },
      {
        path: 'items',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/items/item-list').then((m) => m.ItemListComponent),
        // The item, the form for a new one and the edit form open beside the list (platform U10); writing is for the Owner.
        children: [
          { path: 'new', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id/edit', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id', children: [] },
        ],
      },
      {
        path: 'vendors',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('./pages/vendors/vendor-list').then((m) => m.VendorListComponent),
        // The vendor, the form for a new one and the edit form open beside the list (platform U10); vendors are the Owner's only.
        children: [
          { path: 'new', children: [] },
          { path: ':id/edit', children: [] },
          { path: ':id', children: [] },
        ],
      },
      {
        path: 'schools',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/schools/school-list').then((m) => m.SchoolListComponent),
        // The school, the form for a new one and the edit form open beside the list (platform U10); writing is for the Owner.
        children: [
          { path: 'new', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id/edit', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id', children: [] },
        ],
      },
      {
        // The screen the forced-change guard and the header's user menu open (`/change-password`); the Settings tab shows the same page.
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password').then((m) => m.ChangePasswordComponent),
      },
      // The user menu opens /profile, /sessions and /login-history (the same links as in the admin app); here they live under Settings.
      { path: 'profile', redirectTo: 'settings/profile', pathMatch: 'full' },
      { path: 'sessions', redirectTo: 'settings/sessions', pathMatch: 'full' },
      { path: 'login-history', redirectTo: 'settings/login-history', pathMatch: 'full' },
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
