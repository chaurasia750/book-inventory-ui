import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkbox-field.html',
  styleUrl: './checkbox-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxFieldComponent {
  label = input<string>('');
  control = input.required<FormControl>();
}
