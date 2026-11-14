import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { TextFieldComponent } from '@org/form-controls';
import { messageForError } from '@org/interceptors';
import { ButtonComponent } from '@org/ui';
import { matchFieldValidator, strongPasswordValidator } from '@org/shared-utils';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TextFieldComponent, ButtonComponent, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly token = signal<string | null>(null);

  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, strongPasswordValidator()],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, matchFieldValidator('password')],
    }),
  });

  readonly verifying = signal(true);
  readonly tokenValid = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  constructor() {
    const token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
    this.token.set(token);

    if (!token) {
      this.verifying.set(false);
      this.errorMessage.set(this.translate.instant('iam.reset.invalidLink'));
      return;
    }

    this.authService.verifyResetToken(token).subscribe({
      next: (response) => {
        this.verifying.set(false);
        this.tokenValid.set(response.valid);
        if (!response.valid) {
          this.errorMessage.set(this.translate.instant('iam.reset.invalidLink'));
        }
      },
      error: () => {
        this.verifying.set(false);
        this.errorMessage.set(this.translate.instant('iam.reset.invalidLink'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.authService
      .resetPassword({ token: this.token() ?? '', newPassword: this.form.controls.password.value })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errorMessage.set(messageForError(error, this.translate));
        },
      });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
