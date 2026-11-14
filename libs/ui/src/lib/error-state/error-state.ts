import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  message = input('Something went wrong');
  showRetry = input(true);

  retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
