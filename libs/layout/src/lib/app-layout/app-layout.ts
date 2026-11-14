import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  title = input('Dashboard');
  homeRoute = input('/');
  showFooter = input(false);
}
