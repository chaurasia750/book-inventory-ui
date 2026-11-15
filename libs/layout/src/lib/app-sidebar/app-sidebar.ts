import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, HostListener, inject, input, OnDestroy, OnInit, signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, Subscription } from 'rxjs';
import { AuthService } from '@org/auth';
import { SidebarService } from '../services/sidebar.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { roleLabel, userDisplayName, userInitials } from '../services/user-label';
import { APP_NAME } from '@org/constants';

export interface SidebarNavSubItem {
  name: string;
  path: string;
  /** Other path prefixes that belong to this entry (a document page opened from a list), so it stays highlighted and titled there. */
  aliases?: string[];
}

export interface SidebarNavItem {
  name: string;
  icon: string;
  path?: string;
  section?: string;
  subItems?: SidebarNavSubItem[];
  /** A count shown beside the entry (platform.md U11); null or empty shows none. */
  badge?: () => string | null;
  /** See {@link SidebarNavSubItem.aliases}. */
  aliases?: string[];
}

/** One menu entry and one of its paths (its own or an alias). */
export interface MenuMatch {
  name: string;
  path: string;
  /** The entry's own path, used to highlight it. */
  entryPath: string;
}

/**
 * The menu entry of a URL (platform U11, U14): the entry whose path or alias is the URL's path or one of its parents, the longest
 * match winning; the query is ignored. The home entry `/` matches only the home page, so a page outside the menu highlights and
 * titles nothing. Written once for the sidebar (highlight) and the header (title).
 */
export function menuEntryOf(url: string, items: SidebarNavItem[]): MenuMatch | null {
  const current = url.split(/[?#]/)[0];
  const candidates = items.flatMap((item) => [
    ...(item.path ? [item.path, ...(item.aliases ?? [])].map((p) => ({ name: item.name, path: p, entryPath: item.path as string })) : []),
    ...(item.subItems ?? []).flatMap((sub) => [sub.path, ...(sub.aliases ?? [])].map((p) => ({ name: sub.name, path: p, entryPath: sub.path }))),
  ]);
  return candidates
    .filter((c) => (c.path === '/' ? current === '/' : current === c.path || current.startsWith(c.path.endsWith('/') ? c.path : c.path + '/')))
    .reduce<MenuMatch | null>((best, c) => (best === null || c.path.length > best.path.length ? c : best), null);
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
  private readonly auth = inject(AuthService);

  navItems = input.required<SidebarNavItem[]>();
  brandName = input(APP_NAME);
  appSubtitle = input('Admin Portal');
  homeRoute = input('/');

  /** platform.md U11 (Plan 0089): the "Search menu" text; empty shows the whole menu. */
  readonly query = signal('');
  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  /** The menu as the search leaves it: an entry stays when its name or one of its sub-pages matches (then only those sub-pages). */
  readonly visibleItems = computed<SidebarNavItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.navItems();
    return this.navItems().flatMap((item) => {
      if (item.name.toLowerCase().includes(q)) return [item];
      const subs = (item.subItems ?? []).filter((s) => s.name.toLowerCase().includes(q));
      return subs.length ? [{ ...item, subItems: subs }] : [];
    });
  });

  readonly userName = computed(() => userDisplayName(this.auth.user()));
  readonly userInitials = computed(() => userInitials(this.userName()));
  readonly userRole = computed(() => roleLabel(this.auth.role()));

  openSubmenu: string | null = null;
  subMenuHeights: Record<string, number> = {};

  readonly isExpanded$ = this.sidebarService.isExpanded$;
  readonly isMobileOpen$ = this.sidebarService.isMobileOpen$;
  readonly isHovered$ = this.sidebarService.isHovered$;

  /** The menu shows names (expanded, hovered or the phone drawer); otherwise only icons. */
  readonly isOpen = toSignal(
    combineLatest([this.isExpanded$, this.isHovered$, this.isMobileOpen$]).pipe(map(([e, h, m]) => !!(e || h || m))),
    { initialValue: false },
  );

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

  /** Ctrl K (Cmd K on a Mac) focuses Search menu, opening the menu first when it is collapsed or off-canvas. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
    event.preventDefault();
    if (window.innerWidth >= 1280) this.sidebarService.setHovered(true);
    else this.sidebarService.setMobileOpen(true);
    setTimeout(() => this.searchBox()?.nativeElement.focus());
  }

  signOut(): void {
    this.auth.logout().subscribe();
  }

  /**
   * The menu item of the current page: the longest menu path that is the current path or one of its parents, ignoring
   * the query. So "/crm/leads/<id>" and "/crm/leads?bucket=Overdue" keep "/crm/leads" highlighted, and "/crm" (the
   * dashboard) is not highlighted while a deeper CRM page is open.
   */
  isActive(path: string): boolean {
    return !!path && path === this.activePath();
  }

  private activePath(): string | null {
    return menuEntryOf(this.router.url, this.navItems())?.entryPath ?? null;
  }

  isChildActive(path: string): boolean {
    const base = path.substring(0, path.lastIndexOf('/'));
    return base.length > 1 && this.router.url.startsWith(base + '/');
  }

  /** U11: a section label (MAIN, MANAGEMENT) is printed once per group - only where it differs from the item before. */
  showSection(index: number): boolean {
    const items = this.visibleItems();
    return !!items[index].section && (index === 0 || items[index - 1].section !== items[index].section);
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
    // The open group is the one that holds the page's menu entry (the same rule as the highlight, aliases included).
    const entryPath = menuEntryOf(currentUrl, this.navItems())?.entryPath ?? null;
    const index = entryPath === null ? -1 : this.navItems().findIndex((nav) => nav.subItems?.some((sub) => sub.path === entryPath));
    const matchedKey: string | null = index < 0 ? null : `main-${index}`;

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
