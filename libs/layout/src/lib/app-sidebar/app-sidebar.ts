import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { SidebarService } from '../services/sidebar.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { APP_NAME } from '@org/constants';

export interface SidebarNavSubItem {
  name: string;
  path: string;
}

export interface SidebarNavItem {
  name: string;
  icon: string;
  path?: string;
  section?: string;
  subItems?: SidebarNavSubItem[];
}

/**
 * Shared sidebar used by both the admin and member layouts — same look and
 * behavior (collapsible, off-canvas on mobile, nested submenus, SVG icons),
 * different `navItems`/`brand` per app.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  readonly sidebarService = inject(SidebarService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  navItems = input.required<SidebarNavItem[]>();
  brandName = input(APP_NAME);
  appSubtitle = input('Admin Portal');
  homeRoute = input('/');

  openSubmenu: string | null = null;
  subMenuHeights: Record<string, number> = {};

  readonly isExpanded$ = this.sidebarService.isExpanded$;
  readonly isMobileOpen$ = this.sidebarService.isMobileOpen$;
  readonly isHovered$ = this.sidebarService.isHovered$;

  private readonly subscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      }),
    );

    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(() => {
        this.cdr.detectChanges();
      }),
    );

    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  isChildActive(path: string): boolean {
    const base = path.substring(0, path.lastIndexOf('/'));
    return base.length > 1 && this.router.url.startsWith(base + '/');
  }

  hasActiveSubItem(item: SidebarNavItem): boolean {
    return !!item.subItems?.some(
      (sub) => this.isActive(sub.path) || this.isChildActive(sub.path),
    );
  }

  toggleSubmenu(section: string, index: number): void {
    const key = `${section}-${index}`;
    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;
      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  isExpanded(state: boolean | null): boolean {
    return state ?? false;
  }

  onSidebarMouseEnter(): void {
    this.isExpanded$
      .subscribe((expanded) => {
        if (!expanded) {
          this.sidebarService.setHovered(true);
        }
      })
      .unsubscribe();
  }

  onSubmenuClick(): void {
    this.isMobileOpen$
      .subscribe((isMobile) => {
        if (isMobile) {
          this.sidebarService.setMobileOpen(false);
        }
      })
      .unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string): void {
    let matchedKey: string | null = null;

    this.navItems().forEach((nav, i) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (currentUrl === subItem.path || this.isChildActive(subItem.path)) {
            matchedKey = `main-${i}`;
          }
        });
      }
    });

    this.openSubmenu = matchedKey;

    Object.keys(this.subMenuHeights).forEach((key) => {
      if (key !== matchedKey) {
        this.subMenuHeights[key] = 0;
      }
    });

    if (matchedKey) {
      setTimeout(() => {
        const el = document.getElementById(matchedKey!);
        if (el) {
          this.subMenuHeights[matchedKey!] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }
}
