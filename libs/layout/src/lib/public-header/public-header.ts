import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { APP_URLS } from '@org/constants';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './public-header.html',
  styleUrl: './public-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly showMobileMenu = signal(false);
  readonly isScrolled = signal(false);

  readonly navLinks = [
    { path: '/', labelKey: 'nav.home', exact: true },
    { path: '/about', labelKey: 'nav.about', exact: false },
    { path: '/contact', labelKey: 'nav.contact', exact: false },
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.showMobileMenu.set(false));
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update((v) => !v);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 12);
  }

  goToDashboard(): void {
    const roles = this.authService.roles();
    window.location.href = roles.includes('admin') ? APP_URLS.ADMIN : APP_URLS.MEMBER;
  }
}
