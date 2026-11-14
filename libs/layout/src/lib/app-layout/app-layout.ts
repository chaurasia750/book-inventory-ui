import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SidebarNavItem, AppSidebarComponent } from '../app-sidebar/app-sidebar';
import { AppHeaderComponent } from '../app-header/app-header';
import { BackdropComponent } from '../backdrop/backdrop';
import { MemberFooterComponent } from '../member-footer/member-footer';
import { APP_NAME } from '@org/constants';

/**
 * Single shared layout for both admin and member apps.
 * Pass different navItems, brandName, appSubtitle, title per app.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, AppHeaderComponent, BackdropComponent, MemberFooterComponent],
  templateUrl: './app-layout.html',
  host: { class: 'flex h-screen overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  navItems = input.required<SidebarNavItem[]>();
  brandName = input(APP_NAME);
  appSubtitle = input('');
  /** The title of pages that are not in the menu (Settings, Change password). */
  title = input('Dashboard');
  homeRoute = input('/');
  showFooter = input(false);

  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** The header's page title: the name of the menu entry of the open page (longest matching path), else `title`. */
  readonly pageTitle = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const entries = this.navItems().flatMap((item) => [
      { name: item.name, path: item.path },
      ...(item.subItems ?? []).map((sub) => ({ name: sub.name, path: sub.path })),
    ]);
    const matches = entries.filter((e) => !!e.path && (e.path === '/' ? path === '/' : path === e.path || path.startsWith(`${e.path}/`)));
    const best = matches.reduce<(typeof entries)[number] | null>((a, e) => (a === null || (e.path ?? '').length > (a.path ?? '').length ? e : a), null);
    return best?.name ?? this.title();
  });
}
