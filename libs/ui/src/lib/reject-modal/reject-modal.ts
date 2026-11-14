import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-reject-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reject-modal.html',
})
export class RejectModalComponent {
  readonly open = input(false);
  readonly title = input('Reject');
  readonly message = input('Please provide a reason for rejection.');
  readonly placeholder = input('Enter reason...');
  readonly confirmText = input('Reject');
  readonly cancelText = input('Cancel');

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  reason = '';
  error = signal(false);

  onConfirm(): void {
    if (!this.reason.trim()) {
      this.error.set(true);
      return;
    }
    this.error.set(false);
    this.confirmed.emit(this.reason.trim());
    this.reason = '';
  }

  onCancel(): void {
    this.error.set(false);
    this.reason = '';
    this.cancelled.emit();
  }
}
