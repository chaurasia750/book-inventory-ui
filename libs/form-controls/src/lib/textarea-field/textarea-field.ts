import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [ReactiveFormsModule, FormErrorComponent],
  templateUrl: './textarea-field.html',
  styleUrl: './textarea-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaFieldComponent {
  private static nextId = 0;
  protected readonly fieldId = `field-${TextareaFieldComponent.nextId++}`;

  label = input<string>('');
  control = input.required<FormControl>();
  rows = input<number>(4);
  hint = input<string>('');
}
