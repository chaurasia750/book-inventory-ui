import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchFieldValidator(otherField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    const otherControl = control.parent.get(otherField);
    if (!otherControl) {
      return null;
    }

    return control.value === otherControl.value ? null : { mismatch: true };
  };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minLength'] = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors['upperCase'] = true;
    }
    if (!/[a-z]/.test(value)) {
      errors['lowerCase'] = true;
    }
    if (!/[0-9]/.test(value)) {
      errors['digit'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
