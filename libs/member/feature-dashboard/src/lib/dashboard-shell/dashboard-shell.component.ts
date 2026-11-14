import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '@org/auth';
import { OrderService } from '@org/api-services';
import { SidebarService, ThemeToggleComponent, NotificationDropdownComponent, UserDropdownComponent } from '@org/layout';
import { MemberDataService } from '@org/member-data-access';
import { SidebarProfileCardComponent, QuickActionsListComponent, TabNavComponent } from '@org/member-ui-sidebar';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    ThemeToggleComponent,
    NotificationDropdownComponent,
    UserDropdownComponent,
    SidebarProfileCardComponent,
    QuickActionsListComponent,
    TabNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
})
export class DashboardShellComponent implements OnInit, OnDestroy {
  private readonly data = inject(MemberDataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  readonly sidebarService = inject(SidebarService);

  readonly sidebarOpen = this.sidebarService.isMobileOpen$;
  readonly sidebarExpanded = this.sidebarService.isExpanded$;
  readonly breadcrumb = signal('Dashboard');
  private sub?: Subscription;

  get userName(): string {
    const u = this.data.member();
    if (!u) return 'User';
    return u.fullName || 'User';
  }

  get userInitials(): string {
    const u = this.data.member();
    if (!u) return 'U';
    const name = u.fullName || '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('') || 'U';
  }

  get userLoginId(): string {
    return this.data.loginId() || '';
  }

  get userEmail(): string {
    return this.data.email() || '';
  }

  get profileImageUrl(): string | null {
    return this.data.memberProfileImageUrl();
  }

  get userRole(): string {
    return this.authService.roles()[0] || 'Member';
  }

  ngOnInit(): void {
    this.data.loadMember('self');
    this.syncBreadcrumb(this.router.url);
    this.redirectIfInactive(this.router.url);
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.syncBreadcrumb(this.router.url);
      this.redirectIfInactive(this.router.url);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /**
   * A franchisee with no Approved/Completed order yet is sent to the subscription page instead of
   * the default Overview landing. This check runs from the component rather
   * than a route guard: a guard here that injects OrderService/Router and resolves during the app's
   * very first navigation reliably throws NG0200 "Circular dependency detected for Router" in this
   * app's bootstrap setup, so the check is done post-navigation instead.
   */
  private redirectIfInactive(url: string): void {
    const path = url.split('?')[0];
    const gatedPaths = ['/', '/overview'];
    if (!gatedPaths.includes(path)) return;

    this.orderService.hasNoPurchasedOrder().subscribe({
      next: (noOrder) => {
        if (noOrder) {
          this.router.navigate(['/subscription'], { replaceUrl: true });
        }
      },
      error: () => { /* stay on the current page */ },
    });
  }

  private syncBreadcrumb(url: string): void {
    const segments = url.split('/').filter(Boolean);
    const segment = segments[0] || 'overview';
    const subSegment = segments[1];
    const map: Record<string, string> = {
      overview: 'Overview',
      'my-team': 'My Team',
      income: 'Income',
      wallet: 'Wallet',
      course: 'Course',
      subscription: 'Subscription',
      epins: 'ePins',
      documents: 'Documents',
      'view-profile': 'View Profile',
      'edit-profile': 'Edit Profile',
      'welcome-letter': 'Welcome Letter',
      genealogy: 'Genealogy',
      'referral-link': 'Referral Link',
      'change-password': 'Change Password',
      'sponsor-new': 'Sponsor New',
    };
    const subMap: Record<string, string> = {
      genealogy: 'Genealogy Tree',
      direct: 'Direct Members',
      indirect: 'Indirect Members',
      total: 'Total Members',
      new: 'New Order',
      list: 'Order List',
      detail: 'Order Detail',
    };
    const base = map[segment] || 'Dashboard';
    const sub = subSegment ? subMap[subSegment] || subSegment : '';
    this.breadcrumb.set(sub ? `${base} - ${sub}` : base);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1280) {
      this.sidebarService.setMobileOpen(false);
    }
  }

  closeSidebar(): void {
    this.sidebarService.setMobileOpen(false);
  }

  toggleSidebar(): void {
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
