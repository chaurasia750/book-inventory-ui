import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[99999] flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" (click)="onCancel()" (keydown.escape)="onCancel()" tabindex="0" role="button" [attr.aria-label]="'Close dialog'"></div>
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl mx-4">
          <h3 class="text-lg font-semibold text-[#111111]">{{ title() }}</h3>
          @if (message()) {
            <p class="mt-2 text-sm text-gray-500">{{ message() }}</p>
          }
          <ng-content></ng-content>
          <div class="mt-5 flex items-center justify-end gap-3">
            <app-button variant="outline" (clicked)="onCancel()">{{ cancelText() }}</app-button>
            <app-button variant="yellow" (clicked)="onConfirm()">{{ confirmText() }}</app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmationDialogComponent {
  readonly open = input(false);
  readonly title = input('Are you sure?');
  readonly message = input('');
  readonly confirmText = input('Confirm');
  readonly cancelText = input('Cancel');

  readonly confirm = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
