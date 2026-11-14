import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@org/auth';

/**
 * Landing screen of the admin and member apps while a module's real dashboard does not exist yet (the legacy
 * dashboards call the previous backend). Texts come from the message catalogue.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-semibold text-primary-fg">
        {{ 'iam.home.welcome' | translate: { name: name() } }}
      </h1>
      <p class="mt-2 text-secondary-fg">{{ 'iam.home.signedInAs' | translate: { role: roleLabel() } }}</p>
    </div>
  `,
})
export class WelcomeComponent {
  private readonly auth = inject(AuthService);

  readonly name = computed(() => this.auth.user()?.fullName ?? '');

  /** `SUPER_ADMIN` -> "Super Admin". */
  readonly roleLabel = computed(() =>
    (this.auth.role() ?? '')
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' '),
  );
}
