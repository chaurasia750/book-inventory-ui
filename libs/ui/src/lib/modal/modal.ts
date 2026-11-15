import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  open = input(false);
  title = input<string | undefined>(undefined);
  /** `wide` for a dialog that holds a table. */
  size = input<'default' | 'wide'>('default');

  closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onDialogClick(event: Event): void {
    event.stopPropagation();
  }

  onCloseClick(): void {
    this.closed.emit();
  }
}
