import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CompanyService } from '@org/api-services';
import { AuthBrandShellComponent } from '@org/layout';
import { messageForError } from '@org/interceptors';
import { APP_URLS } from '@org/constants';

/** The address to open after sign-in when the sign-in page was opened for a given page (`returnUrl`): this site only, never a public page. */
function safeReturnUrl(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  try {
    const url = new URL(returnUrl, window.location.origin);
    const isSameOrigin = url.origin === window.location.origin;
    const isDevUrl = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isPublicPage = /^\/(login|auth|error|welcome)(\/|$)/.test(url.pathname);
    if ((!isSameOrigin && !isDevUrl) || isPublicPage || url.pathname === '/') return null;
    return isSameOrigin ? url.pathname + url.search + url.hash : url.origin + url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthBrandShellComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  readonly form = new FormGroup({
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    keepMeSignedIn: new FormControl(false, { nonNullable: true }),
  });


  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly companies = inject(CompanyService);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set('');
      }
    });
  }

  ngOnInit(): void {
    const loggedOut = this.route.snapshot.queryParamMap.get('loggedOut') === '1';
    if (loggedOut) {
      this.authService.setUnauthenticated();
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.errorMessage.set('');
    this.isLoading.set(true);
    this.form.disable();

    const { userName, password, keepMeSignedIn } = this.form.getRawValue();

    this.authService.login({ identifier: userName.trim(), password, rememberMe: keepMeSignedIn }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.form.enable();
        this.errorMessage.set(messageForError(err, this.translate));
      },
    });
  }

  /**
   * Where the user goes after signing in (platform spec U12): back to the page they asked for, to `/admin` for staff, or to
   * their company's address `/<slug>/`. When the slug cannot be read (a forced password change blocks the call) the old
   * `/member/` address opens the same app, which corrects the address itself.
   */
  private redirectAfterLogin(): void {
    const returned = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    const roles = this.authService.roles();
    if (returned) {
      window.location.href = returned;
    } else if (roles.includes('admin')) {
      window.location.href = APP_URLS.ADMIN;
    } else if (roles.includes('member')) {
      this.companies.current().subscribe({
        next: (view) => (window.location.href = view.company ? `/${view.company.slug}/` : APP_URLS.ADMIN),
        error: () => (window.location.href = APP_URLS.MEMBER),
      });
    } else {
      window.location.href = APP_URLS.PUBLIC;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.errors || !field?.touched) return '';
    if (field.errors['required']) return this.translate.instant(fieldName === 'userName' ? 'login.validation.userIdRequired' : 'login.validation.passwordRequired');
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }
}
