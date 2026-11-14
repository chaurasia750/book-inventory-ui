import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { messageForError } from '@org/interceptors';
import { matchFieldValidator, strongPasswordValidator } from '@org/shared-utils';

/**
 * The one change-password screen of the admin and member apps. It is also the forced-change screen: while the server
 * says the password must be changed (`mustChangePassword`), the guard sends every route here, and a successful change
 * returns a fresh access token (the old one still says the change is pending), so the app continues without a new login.
 * All texts come from the message catalogue; a failure shows the catalogue text of the API's error code.
 */
@Component({
  selector: 'lib-change-password-screen',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-lg">
      <div class="rounded-2xl border border-default bg-surface p-5 shadow-xl sm:p-8">
        <h2 class="mb-2 text-2xl font-bold text-primary-fg">{{ 'changePassword.title' | translate }}</h2>
        @if (auth.mustChangePassword()) {
          <p class="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500" role="status">
            {{ 'changePassword.forced' | translate }}
          </p>
        }
        @if (errorMessage()) {
          <p class="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400" role="alert">{{ errorMessage() }}</p>
        }
        @if (done()) {
          <p class="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-xs font-medium text-green-400" role="status">{{ 'changePassword.success' | translate }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="currentPassword" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'changePassword.current' | translate }}</label>
            <input id="currentPassword" type="password" formControlName="currentPassword" autocomplete="current-password"
              class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg focus:outline-none focus:ring-2 focus:ring-saffron-500/30" />
          </div>
          <div>
            <label for="newPassword" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'changePassword.new' | translate }}</label>
            <input id="newPassword" type="password" formControlName="newPassword" autocomplete="new-password"
              class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg focus:outline-none focus:ring-2 focus:ring-saffron-500/30" />
            <p class="mt-1 text-xs text-gray-500">{{ 'changePassword.hint' | translate }}</p>
            @if (form.controls.newPassword.touched && form.controls.newPassword.errors) {
              <p class="mt-1 text-xs text-red-400">{{ 'changePassword.weak' | translate }}</p>
            }
          </div>
          <div>
            <label for="confirmPassword" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'changePassword.confirm' | translate }}</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password"
              class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg focus:outline-none focus:ring-2 focus:ring-saffron-500/30" />
            @if (form.controls.confirmPassword.touched && form.controls.confirmPassword.errors) {
              <p class="mt-1 text-xs text-red-400">{{ 'changePassword.mismatch' | translate }}</p>
            }
          </div>
          <button type="submit" [disabled]="submitting()"
            class="w-full rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-40">
            {{ (submitting() ? 'changePassword.saving' : 'changePassword.submit') | translate }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordScreenComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly form = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPasswordValidator()] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, matchFieldValidator('newPassword')] }),
  });

  readonly submitting = signal(false);
  readonly done = signal(false);
  readonly errorMessage = signal('');

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.submitting.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
        this.form.reset();
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(messageForError(error, this.translate));
      },
    });
  }
}
