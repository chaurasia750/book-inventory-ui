import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-overview',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-default bg-surface p-5 lg:p-6">
      <h3 class="mb-2 text-lg font-semibold text-primary-fg">Account Settings</h3>
      <p class="text-sm text-secondary-fg mb-6">Manage your profile, password, and bank details from here.</p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a routerLink="edit-profile"
          class="group flex items-center gap-4 rounded-xl border border-default p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600 group-hover:bg-saffron-100">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-primary-fg">Edit Profile</p>
            <p class="text-xs text-secondary-fg">Update your personal details</p>
          </div>
        </a>

        <a routerLink="welcome-letter"
          class="group flex items-center gap-4 rounded-xl border border-default p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-primary-fg">Welcome Letter</p>
            <p class="text-xs text-secondary-fg">View and download your letter</p>
          </div>
        </a>

        <a routerLink="change-password"
          class="group flex items-center gap-4 rounded-xl border border-default p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-primary-fg">Change Password</p>
            <p class="text-xs text-secondary-fg">Update your account password</p>
          </div>
        </a>

        <a routerLink="bank-account"
          class="group flex items-center gap-4 rounded-xl border border-default p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-primary-fg">Bank Account</p>
            <p class="text-xs text-secondary-fg">Manage your bank details</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class SettingsOverviewComponent {}
