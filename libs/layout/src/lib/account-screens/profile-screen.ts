import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamSelfService } from '@org/api-services';
import { AuthService } from '@org/auth';
import { messageForError } from '@org/interceptors';
import { avatarColorClass, initials } from '@org/shared-utils';
import { ToastService } from '@org/ui';

/**
 * "My profile" (spec R35, R41): the caller edits their own full name, e-mail and mobile. The user name and the role are shown
 * but never editable. Changing the e-mail or the mobile asks for the current password - the field appears only then - because
 * a stolen access token must not be enough to take over the account's recovery address. Every text and every error comes from
 * the message catalogue.
 */
@Component({
  selector: 'lib-profile-screen',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-2xl p-6">
      <div class="rounded-2xl border border-default bg-surface p-8 shadow-xl">
        <div class="mb-6 flex items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold" [class]="avatarClass()">{{ avatarInitials() }}</div>
          <div>
            <h2 class="text-2xl font-bold text-primary-fg">{{ 'account.profile.title' | translate }}</h2>
            <p class="text-sm text-gray-500">{{ userName() }} &middot; {{ 'account.role.' + (auth.role() ?? 'MEMBER') | translate }}</p>
          </div>
        </div>

        @if (errorMessage()) {
          <p class="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400" role="alert">{{ errorMessage() }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="fullName" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'account.profile.fullName' | translate }}</label>
            <input id="fullName" formControlName="fullName" class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg" />
          </div>
          <div>
            <label for="email" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'account.profile.email' | translate }}</label>
            <input id="email" type="email" formControlName="email" class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg" />
          </div>
          <div>
            <label for="mobile" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'account.profile.mobile' | translate }}</label>
            <input id="mobile" formControlName="mobile" class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg" />
          </div>
          @if (contactChanged()) {
            <div>
              <label for="currentPassword" class="mb-1.5 block text-sm font-semibold text-primary-fg">{{ 'account.profile.currentPassword' | translate }}</label>
              <input id="currentPassword" type="password" formControlName="currentPassword" autocomplete="current-password" class="h-11 w-full rounded-xl border border-default bg-surface px-4 text-sm text-primary-fg" />
              <p class="mt-1 text-xs text-gray-500">{{ 'account.profile.passwordHint' | translate }}</p>
            </div>
          }
          <button type="submit" [disabled]="saving()" class="w-full rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-40">
            {{ (saving() ? 'account.profile.saving' : 'account.profile.save') | translate }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ProfileScreenComponent {
  protected readonly auth = inject(AuthService);
  private readonly self = inject(IamSelfService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly userName = computed(() => this.auth.user()?.userName ?? '');
  readonly avatarInitials = computed(() => initials(this.auth.user()?.fullName ?? this.userName()));
  readonly avatarClass = computed(() => avatarColorClass(this.auth.user()?.fullName ?? this.userName()));
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  private readonly typed = signal({ email: '', mobile: '' });

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true }),
    currentPassword: new FormControl('', { nonNullable: true }),
  });

  /** True while the e-mail or the mobile differs from the stored one - the moment the current password is needed. */
  readonly contactChanged = computed(() => {
    const user = this.auth.user();
    const typed = this.typed();
    return (typed.email.trim() !== (user?.email ?? '')) || (typed.mobile.trim() !== (user?.mobile ?? ''));
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) return;
      this.form.patchValue({ fullName: user.fullName, email: user.email ?? '', mobile: user.mobile ?? '', currentPassword: '' }, { emitEvent: false });
      this.typed.set({ email: user.email ?? '', mobile: user.mobile ?? '' });
    });

    this.form.valueChanges.subscribe(() => {
      const { email, mobile } = this.form.getRawValue();
      this.typed.set({ email, mobile });
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, mobile, currentPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.errorMessage.set('');
    this.self
      .updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        currentPassword: this.contactChanged() ? currentPassword : undefined,
      })
      .subscribe({
        next: () => {
          this.auth.refresh().subscribe({
            next: () => {
              this.saving.set(false);
              this.toast.show(this.translate.instant('account.profile.saved'), 'success');
            },
            error: () => this.saving.set(false),
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.errorMessage.set(messageForError(error, this.translate));
        },
      });
  }
}
