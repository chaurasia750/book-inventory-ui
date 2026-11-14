import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@org/api-services';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-md">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

      @if (successMessage()) {
        <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ successMessage() }}</div>
      }
      @if (errorMessage()) {
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ errorMessage() }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="oldPassword" class="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
          <div class="relative">
            <input [type]="showOld() ? 'text' : 'password'" [(ngModel)]="model.oldPassword" name="oldPassword"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Enter old password" required />
            <button type="button" (click)="showOld.set(!showOld())"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {{ showOld() ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div class="relative">
            <input [type]="showNew() ? 'text' : 'password'" [(ngModel)]="model.newPassword" name="newPassword"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Enter new password" required />
            <button type="button" (click)="showNew.set(!showNew())"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {{ showNew() ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div class="relative">
            <input [type]="showConfirm() ? 'text' : 'password'" [(ngModel)]="model.confirmPassword" name="confirmPassword"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Confirm new password" required />
            <button type="button" (click)="showConfirm.set(!showConfirm())"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {{ showConfirm() ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <button type="submit" [disabled]="isSubmitting()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed">
          @if (isSubmitting()) {
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          }
          {{ isSubmitting() ? 'Changing...' : 'Change Password' }}
        </button>
      </form>
    </div>
  `,
})
export class ChangePasswordComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly appPrefix = input<string>('');
  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly showOld = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  model = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  onSubmit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.model.newPassword !== this.model.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.api
      .post<{ message: string }>('/auth/change-password', {
        oldPassword: this.model.oldPassword,
        newPassword: this.model.newPassword,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          this.successMessage.set((res as unknown as { message: string })?.message || 'Password changed successfully');
          this.model = { oldPassword: '', newPassword: '', confirmPassword: '' };
          const prefix = this.appPrefix();
          const dashboard = prefix === 'member' ? `/${prefix}` : `/${prefix}/dashboard`;
          this.router.navigate([dashboard]);
        },
        error: (err) => {
          const body = err.error;
          const raw = body?.message?.text ?? body?.message?.message ?? body?.message ?? err.message ?? 'Failed to change password';
          const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
          this.errorMessage.set(msg);
        },
      });
  }
}
