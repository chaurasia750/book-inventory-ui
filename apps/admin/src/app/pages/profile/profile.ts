import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@org/auth';
import { ButtonComponent, CardComponent, ToastService } from '@org/ui';
import { TextFieldComponent } from '@org/form-controls';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, ButtonComponent, TextFieldComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly currentUser;
  readonly initials;

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  constructor() {
    this.currentUser = this.authService.currentUser;
    this.initials = computed(() => {
      const user = this.currentUser();
      if (!user) {
        return '';
      }
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    });

    const user = this.currentUser();
    if (user) {
      this.form.setValue({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.toastService.show('Profile updated successfully.', 'success');
  }
}
