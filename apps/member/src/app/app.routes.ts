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
      // Sales spec Q11: the order editor and the invoice open full width from the school's profile (not a menu entry, platform U14).
      // Sales R19: the Orders menu: every school's orders and invoices.
      {
        path: 'orders',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/sales/documents-page').then((m) => m.DocumentsPageComponent),
        data: { kind: 'orders' },
      },
      {
        path: 'invoices',
        pathMatch: 'full',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/sales/documents-page').then((m) => m.DocumentsPageComponent),
        data: { kind: 'invoices' },
      },
      {
        path: 'school-orders/:id',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/sales/order-editor').then((m) => m.OrderEditorComponent),
      },
      {
        path: 'invoices/:id',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/sales/invoice-view').then((m) => m.InvoiceViewComponent),
      },
      {
        path: 'company-profile',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('./pages/company/company-profile').then((m) => m.CompanyProfileComponent),
      },
      {
        // A section of the Company profile has its own address, `/company-profile/bank` (platform U16).
        path: 'company-profile/:tab',
        canActivate: [appRoleGuard(['OWNER'])],
        loadComponent: () => import('./pages/company/company-profile').then((m) => m.CompanyProfileComponent),
      },
      // The session cut-offs are a tab of the Company profile now (platform U14b); the old address still works.
      { path: 'session-cut-offs', redirectTo: 'company-profile/cutoffs', pathMatch: 'full' },
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
          // A tab of the vendor has its own address, `/vendors/:id/ledger` (platform U16).
          { path: ':id/:tab', children: [] },
          { path: ':id', children: [] },
        ],
      },
      {
        path: 'customers',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/customers/customer-list').then((m) => m.CustomerListComponent),
        // The customer, the form for a new one and the edit form open beside the list (platform U10); Staff add but never edit (customer R9).
        children: [
          { path: 'new', children: [] },
          { path: ':id/edit', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id', children: [] },
        ],
      },
      {
        // Sales R49: the bills list with a bill's detail panel; it sits before `counters` so `bills` is not read as a counter id.
        path: 'counters/bills',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/counters/counter-bills').then((m) => m.CounterBillsComponent),
        // One bill opens beside the list (platform U10); the id is the bill's.
        children: [{ path: ':id', children: [] }],
      },
      {
        // Sales R42-R46: the counter's billing screen, full width (platform U14); it sits before `counters` so `:id/bill` is not read as a counter id.
        path: 'counters/:id/bill',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/counters/counter-billing').then((m) => m.CounterBillingComponent),
      },
      {
        // Sales R50: the read-only day summary; it sits before `counters` so `day-summary` is not read as a counter id.
        path: 'counters/day-summary',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/counters/counter-day-summary').then((m) => m.CounterDaySummaryComponent),
      },
      {
        path: 'counters',
        canActivate: [appRoleGuard(['OWNER', 'STAFF'])],
        loadComponent: () => import('./pages/counters/counter-list').then((m) => m.CounterListComponent),
        // The counter, the form for a new one and the edit form open beside the list (platform U10); only the Owner writes (sales R48).
        children: [
          { path: 'new', canActivate: [appRoleGuard(['OWNER'])], children: [] },
          { path: ':id/edit', canActivate: [appRoleGuard(['OWNER'])], children: [] },
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
          // A tab of the school has its own address, `/schools/:id/payments` (platform U16), and a record of the tab is one segment more (`/schools/:id/payments/:itemId`); the panel state reads them like `:id`.
          { path: ':id/:tab/:itemId', children: [] },
          { path: ':id/:tab', children: [] },
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
