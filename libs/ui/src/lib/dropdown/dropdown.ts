import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

export interface DropdownOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  options = input<DropdownOption[]>([]);
  value = model<any>(undefined);
  placeholder = input('Select...');

  readonly open = signal(false);

  selectedLabel = computed(() => {
    const match = this.options().find((o) => o.value === this.value());
    return match ? match.label : this.placeholder();
  });

  toggleOpen(): void {
    this.open.update((v) => !v);
  }

  selectOption(option: DropdownOption): void {
    this.value.set(option.value);
    this.open.set(false);
  }
}
