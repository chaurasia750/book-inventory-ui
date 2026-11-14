import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PUBLIC_ROUTES } from '@org/constants';
import { MemberRegistrationResponse } from '@org/shared-models';
import { homeUrlForRole } from './app-home';
import { AuthService } from './auth.service';

/**
 * What the sign-up page does with the answer of the registration endpoint (`Registration:Mode`). Under
 * `ApprovalRequired` the agent has no session and is shown the welcome page, whose text comes from the catalogue; under
 * `InstantLogin` the answer carries a sign-in, which is adopted before the browser is sent straight to the member
 * dashboard (a hard navigation, because the dashboard is another bundle; the refresh cookie set by the same answer restores
 * the session there).
 */
@Injectable({ providedIn: 'root' })
export class RegistrationHandoffService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  complete(response: MemberRegistrationResponse): void {
    if (response.outcome === 'SIGNED_IN' && response.signIn) {
      this.authService.adoptSession(response.signIn);
      window.location.href = homeUrlForRole(response.signIn.user.role);
      return;
    }

    void this.router.navigateByUrl(`/${PUBLIC_ROUTES.WELCOME}`);
  }
}
