import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-shared-user-select',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select [(ngModel)]="value" (ngModelChange)="onSelect($event)" [disabled]="disabled"
      class="block w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 cursor-pointer h-10 border-gray-200 text-gray-700 focus:border-[#66B42A] focus:ring-[#66B42A]/20">
      <option value="" disabled>{{ placeholderText }}</option>
      @for (u of users$ | async; track u.id) {
        <option [value]="u.id">{{ u.fullName }}</option>
      }
    </select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedUserSelectComponent),
      multi: true,
    },
  ],
})
export class SharedUserSelectComponent implements ControlValueAccessor {
  private readonly usersService = inject(UsersService);

  placeholderText = 'Select user';
  readonly users$ = this.usersService.getUsers();
  value: number | string = '';
  disabled = false;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void { this.value = value ?? ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onSelect(val: any): void {
    const num = parseInt(val, 10);
    this.value = isNaN(num) ? val : num;
    this.onChange(this.value);
    this.onTouched();
  }
}
