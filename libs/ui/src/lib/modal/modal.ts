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
