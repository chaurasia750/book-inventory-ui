import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DrawerSide = 'left' | 'right';

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerComponent {
  open = input(false);
  side = input<DrawerSide>('right');

  closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onPanelClick(event: Event): void {
    event.stopPropagation();
  }
}
