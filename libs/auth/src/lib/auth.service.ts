import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE_URL, SKIP_ERROR_TOAST } from '@org/api-services';
import { STORAGE_KEYS } from '@org/constants';
import {
  AppRole,
  AuthTokenResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  isStaffRole,
  LoginRequest,
  ResetPasswordRequest,
  Role,
  User,
  VerifyResetTokenResponse,
} from '@org/shared-models';
import { LOGIN_URL } from './login-url.token';

/**
 * Session handling for every app.
 *
 * - The session lives in two HttpOnly cookies the API sets (the access token for every call, the refresh token for the auth
 *   path); page scripts never see a token and nothing secret is written to browser storage. The service only keeps
 *   who is signed in.
 * - Every app calls {@link initializeSession} at start-up: `GET auth/me` answers from the access cookie, so a reload or a
 *   hard navigation between apps needs no token exchange. Only when the short-lived access cookie has run out does the
 *   refresh cookie get a new one (`POST auth/refresh`).
 * - The members older pages already use (`roles()`, `isAuthenticated`, `currentUser`, `hasRole`, `logout`, ...) keep
 *   working; `role()` exposes the real role from the API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly loginUrl = inject(LOGIN_URL);

  private refreshInFlight$: Observable<AuthUser> | null = null;

  /** The signed-in user exactly as the API describes them. */
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  /** The real role (`SUPER_ADMIN`, `SALES_CRM`, `ACCOUNTS`, `MEMBER`). */
  readonly role = computed<AppRole | null>(() => this.user()?.role ?? null);
  readonly userId = computed(() => this.user()?.id ?? null);
  readonly mustChangePassword = computed(() => this.user()?.mustChangePassword === true);

  /** Older pages: staff roles count as `admin`, `MEMBER` as `member`. */
  readonly roles = computed<Role[]>(() => {
    const role = this.role();
    if (!role) return [];
    return isStaffRole(role) ? ['admin'] : ['member'];
  });

  /** Older pages: the user in the previous shape (first/last name split from the full name). */
  readonly currentUser = computed<User | null>(() => {
    const user = this.user();
    if (!user) return null;
    const [firstName, ...rest] = user.fullName.trim().split(/\s+/);
    return {
      id: user.id,
      email: user.email ?? '',
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      roles: this.roles(),
      createdAt: '',
    };
  });

  /** Restores the session at application start. Never fails: no session simply means "logged out". */
  initializeSession(): Observable<void> {
    if (!this.hasSessionHint()) {
      return of(void 0);
    }

    return this.loadUser().pipe(
      catchError(() => this.refresh()),
      map(() => void 0),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  /** Who the access cookie belongs to. A 401 means the short-lived access token ran out (see {@link refresh}). */
  loadUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/me`, this.options()).pipe(
      tap((user) => {
        this.user.set(user);
        this.setSessionHint(true);
      }),
    );
  }

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<AuthTokenResponse>(`${this.baseUrl}/auth/login`, request, this.options())
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
      );
  }

  /** Gets a new access cookie with the refresh cookie. Concurrent callers share one request. */
  refresh(): Observable<AuthUser> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<AuthTokenResponse>(`${this.baseUrl}/auth/refresh`, {}, this.options())
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
  }

  /** Older name for {@link refresh}. */
  refreshSession(): Observable<void> {
    return this.refresh().pipe(map(() => void 0));
  }

  /**
   * The legacy registration endpoint hands back a token; the cookies are what sign the browser in, so this only loads the
   * user behind them (a refresh when the access cookie is missing).
   */
  establishSessionFromRegistration(): Observable<void> {
    return this.loadUser().pipe(
      catchError(() => this.refresh()),
      map(() => void 0),
    );
  }

  /**
   * Adopts the sign-in the registration endpoint answered with (`Registration:Mode = InstantLogin`). The refresh cookie
   * was set by that same response, so a later hard navigation restores the session like after a login.
   */
  adoptSession(response: AuthTokenResponse): void {
    this.applySession(response);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {}, this.options()).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearSession();
        this.redirectToLogin(undefined, true);
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<AuthUser> {
    return this.http
      .post<AuthTokenResponse>(`${this.baseUrl}/auth/change-password`, request, this.options())
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/forgot-password`, request, this.options());
  }

  verifyResetToken(token: string): Observable<VerifyResetTokenResponse> {
    return this.http.get<VerifyResetTokenResponse>(`${this.baseUrl}/auth/reset-password/verify`, {
      params: { token },
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    });
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/reset-password`, request, this.options());
  }

  /** True while a refresh attempt is worthwhile (there was a session in this browser). */
  shouldAutoRefresh(): boolean {
    return this.hasSessionHint();
  }

  /** Older pages: `admin` / `member` bucket check. */
  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  /** The real role check. */
  hasAppRole(...roles: AppRole[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  setUnauthenticated(): void {
    this.clearSession();
  }

  /** Drops the session and sends the browser to the login page (hard navigation; login is another bundle). */
  expireSessionSilently(): void {
    this.clearSession();
    this.redirectToLogin(window.location.href);
  }

  redirectToLogin(returnUrl?: string, loggedOut = false): void {
    const url = new URL(this.loginUrl, window.location.origin);
    if (returnUrl) url.searchParams.set('returnUrl', returnUrl);
    if (loggedOut) url.searchParams.set('loggedOut', '1');
    // A relative login URL stays relative so the browser remains on the same origin.
    window.location.href = this.loginUrl.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
  }

  /** Auth calls show their own errors on the page, so the global toast is skipped. */
  private options() {
    return {
      withCredentials: true,
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    };
  }

  private applySession(response: AuthTokenResponse): void {
    this.user.set(response.user);
    this.setSessionHint(true);
  }

  private clearSession(): void {
    this.user.set(null);
    this.setSessionHint(false);
  }

  private hasSessionHint(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.SESSION_HINT) === '1';
    } catch {
      return false;
    }
  }

  private setSessionHint(on: boolean): void {
    try {
      if (on) localStorage.setItem(STORAGE_KEYS.SESSION_HINT, '1');
      else localStorage.removeItem(STORAGE_KEYS.SESSION_HINT);
    } catch {
      // storage unavailable (private mode): the hint is only an optimisation
    }
  }
}
