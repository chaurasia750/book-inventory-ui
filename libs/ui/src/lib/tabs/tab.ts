import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

let tabIdCounter = 0;

@Component({
  selector: 'app-tab',
  standalone: true,
  templateUrl: './tab.html',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  label = input<string>('');

  readonly id = `app-tab-${tabIdCounter++}`;
  readonly active = signal(false);

  setActive(value: boolean): void {
    this.active.set(value);
  }
}
