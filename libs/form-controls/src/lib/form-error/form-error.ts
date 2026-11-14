import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: true,
  templateUrl: './form-error.html',
  styleUrl: './form-error.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorComponent {
  control = input<AbstractControl | null>(null);

  get message(): string | null {
    const control = this.control();
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const errors = control.errors;

    if (errors['required']) {
      return 'This field is required.';
    }
    if (errors['email']) {
      return 'Please enter a valid email address.';
    }
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `Must be at least ${requiredLength} characters.`;
    }
    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `Must be no more than ${requiredLength} characters.`;
    }
    if (errors['pattern']) {
      return 'The value entered is not in the correct format.';
    }
    if (errors['mismatch']) {
      return 'Values do not match.';
    }

    const firstKey = Object.keys(errors)[0];
    return firstKey ? 'This field is invalid.' : null;
  }
}
