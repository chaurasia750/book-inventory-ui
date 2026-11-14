import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PendingRequestsService } from '@org/shared-utils';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      pointer-events: none;
      height: 3px;
    }
    .bar {
      height: 100%;
      background: linear-gradient(90deg, #85C94E, #66B42A, #85C94E);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      transition: width 0.3s ease;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  template: `
    @if (pending.activeRequests() > 0) {
      <div class="bar" [style.width]="pending.activeRequests() > 3 ? '100%' : '60%'"></div>
    }
  `,
})
export class GlobalLoaderComponent {
  readonly pending = inject(PendingRequestsService);
}
