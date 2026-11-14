import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Platform spec U11: the one frame of every sign-in screen (login, forgot and reset password, welcome) - a charcoal brand
 * panel on desktop and the page's own form on the right, taken from the owner's project `relator-rj-ui`. Pages project
 * their content; there is no logic here.
 */
@Component({
  selector: 'app-auth-brand-shell',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-brand-shell.html',
})
export class AuthBrandShellComponent {
  /** Wider form column. */
  readonly wide = input(false);

  readonly points = [
    { key: 'login.hero.features.earningsTitle', path: 'M4 6h16M4 12h16M4 18h10' },
    { key: 'login.hero.features.securityTitle', path: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4' },
    { key: 'login.hero.features.supportTitle', path: 'M4 12a8 8 0 0116 0v4a2 2 0 01-2 2h-1v-6h3M4 12v4a2 2 0 002 2h1v-6H4' },
  ];
}
