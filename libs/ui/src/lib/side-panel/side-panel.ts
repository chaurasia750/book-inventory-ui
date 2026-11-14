import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in-right 0.25s ease-out;
    }
  `],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[9999]">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
      </div>

      <div
        class="fixed top-0 right-0 z-[9999] h-full bg-surface border-l border-default shadow-modal flex flex-col animate-slide-in max-w-full"
        [style.width]="panelWidth()" (click)="$event.stopPropagation()" (keydown.escape)="close()" tabindex="0" role="dialog" [attr.aria-label]="title()">
        <div class="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">
          <h3 class="text-lg font-semibold text-primary-fg truncate pr-4">{{ title() }}</h3>
          <button type="button"
            (click)="close()"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default text-secondary-fg hover:bg-surface-hover hover:text-primary-fg transition-colors duration-150">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 flex flex-col px-6 py-5 min-h-0 overflow-y-auto">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
})
export class SidePanelComponent {
  readonly isOpen = input(false);
  readonly title = input('');
  readonly panelWidth = input('480px');
  readonly closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
