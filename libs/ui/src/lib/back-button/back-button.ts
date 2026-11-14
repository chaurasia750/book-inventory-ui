import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-button variant="outline" size="sm" (clicked)="back.emit()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
      </svg>
      {{ label() }}
    </app-button>
  `,
})
export class BackButtonComponent {
  readonly label = input('Back');
  readonly back = output<void>();
}
