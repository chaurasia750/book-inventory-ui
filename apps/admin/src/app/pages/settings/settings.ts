import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent, CardComponent, ToastService } from '@org/ui';
import { CheckboxFieldComponent, TextFieldComponent } from '@org/form-controls';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, ButtonComponent, TextFieldComponent, CheckboxFieldComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  readonly form = new FormGroup({
    siteName: new FormControl('Book Inventory', { nonNullable: true, validators: [Validators.required] }),
    supportEmail: new FormControl('support@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    darkModeDefault: new FormControl(false, { nonNullable: true }),
    notificationsEnabled: new FormControl(true, { nonNullable: true }),
  });

  private readonly toastService = inject(ToastService);

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.toastService.show('Settings saved successfully.', 'success');
  }
}
