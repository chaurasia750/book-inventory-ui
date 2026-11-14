import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@org/auth';
import { APP_NAME, FEATURES } from '@org/constants';
import { SidebarService } from '../services/sidebar.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserDropdownComponent, ThemeToggleComponent, NotificationDropdownComponent],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  private readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);

  readonly appName = APP_NAME;
  readonly features = FEATURES;

  readonly isMobileOpen$ = this.sidebarService.isMobileOpen$;

  get userName(): string {
    return this.authService.user()?.fullName?.trim() || 'User';
  }

  get userInitials(): string {
    const parts = this.userName.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  }

  get userLoginId(): string {
    return this.authService.user()?.userName?.trim() || '';
  }

  get userEmail(): string {
    return this.authService.user()?.email?.trim() || '';
  }

  /** The real role from the API (`SUPER_ADMIN` -> "Super Admin"). */
  get userRole(): string {
    const role = this.authService.role();
    if (!role) return 'User';
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  get isMember(): boolean {
    return this.authService.roles().includes('member');
  }

  get isAdmin(): boolean {
    return this.authService.roles().includes('admin');
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
