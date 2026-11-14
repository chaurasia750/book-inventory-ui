import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error';

export interface SelectFieldOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [ReactiveFormsModule, FormErrorComponent],
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFieldComponent {
  private static nextId = 0;
  protected readonly fieldId = `field-${SelectFieldComponent.nextId++}`;

  label = input<string>('');
  control = input.required<FormControl>();
  options = input<SelectFieldOption[]>([]);
}
