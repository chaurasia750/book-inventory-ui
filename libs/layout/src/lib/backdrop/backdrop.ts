import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SidebarService } from '../services/sidebar.service';

@Component({
  selector: 'app-backdrop',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileOpen$ | async) {
      <div
        class="fixed inset-0 z-[999999] bg-gray-900/50 lg:hidden"
        (click)="closeSidebar()"
        (keydown.escape)="closeSidebar()"
        tabindex="0"
        role="button"
        aria-label="Close sidebar">
      </div>
    }
  `,
})
export class BackdropComponent {
  private readonly sidebarService = inject(SidebarService);
  readonly isMobileOpen$ = this.sidebarService.isMobileOpen$;

  closeSidebar(): void {
    this.sidebarService.setMobileOpen(false);
  }
}
