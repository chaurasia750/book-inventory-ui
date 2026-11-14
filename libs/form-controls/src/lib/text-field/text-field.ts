import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error';

export type TextFieldType = 'text' | 'email' | 'password' | 'number';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [ReactiveFormsModule, FormErrorComponent],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  private static nextId = 0;
  protected readonly fieldId = `field-${TextFieldComponent.nextId++}`;

  label = input<string>('');
  control = input.required<FormControl>();
  type = input<TextFieldType>('text');
  placeholder = input<string>('');
  hint = input<string>('');
}
