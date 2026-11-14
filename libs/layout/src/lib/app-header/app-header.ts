import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@org/auth';
import { APP_NAME } from '@org/constants';
import { SidebarService } from '../services/sidebar.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { roleLabel, userDisplayName } from '../services/user-label';

/**
 * platform spec U9: the one 56 px header bar of both apps - the menu button, the page title, then whatever the app
 * projects (the Super Admin's company picker), the theme switch and the user menu.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserDropdownComponent, ThemeToggleComponent],
  templateUrl: './app-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class AppHeaderComponent {
  /** The page title shown beside the menu button. */
  readonly title = input('');
  /** The app's home route. */
  readonly homeRoute = input('/');

  private readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);

  readonly appName = APP_NAME;
  readonly isMobileOpen$ = this.sidebarService.isMobileOpen$;

  get userName(): string {
    return userDisplayName(this.authService.user());
  }

  get userLoginId(): string {
    return this.authService.user()?.userName?.trim() || '';
  }

  get userEmail(): string {
    return this.authService.user()?.email?.trim() || '';
  }

  get userRole(): string {
    return roleLabel(this.authService.role());
  }

  handleToggle(): void {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
