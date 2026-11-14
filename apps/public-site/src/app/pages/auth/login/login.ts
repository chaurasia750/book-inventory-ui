import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { messageForError } from '@org/interceptors';
import { APP_URLS } from '@org/constants';

function redirectTarget(roles: readonly string[], returnUrl: string | null): string {
  if (returnUrl) {
    try {
      const url = new URL(returnUrl, window.location.origin);
      // Accept if same origin OR if it's a localhost dev URL (cross-port)
      const isSameOrigin = url.origin === window.location.origin;
      const isDevUrl = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      if (isSameOrigin || isDevUrl) {
        if (url.pathname.startsWith(APP_URLS.ADMIN) || url.pathname.startsWith(APP_URLS.MEMBER)) {
          // In dev mode, return full URL to cross-port redirect
          if (!isSameOrigin) return url.origin + url.pathname + url.search + url.hash;
          return url.pathname + url.search + url.hash;
        }
      }
    } catch {
      // ignore malformed returnUrl
    }
  }
  if (roles.includes('admin')) return APP_URLS.ADMIN;
  if (roles.includes('member')) return APP_URLS.MEMBER;
  return APP_URLS.PUBLIC;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
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

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target = redirectTarget(this.authService.roles(), returnUrl);
    window.location.href = target;
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
