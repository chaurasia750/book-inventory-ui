import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type TitleOption = 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof' | 'Er';

const TITLE_OPTIONS: TitleOption[] = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Er'];

@Component({
  selector: 'app-title-select',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TitleSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      (blur)="onBlur()"
      [disabled]="disabled()"
      class="h-full w-full cursor-pointer appearance-none bg-surface px-3 py-3 text-sm text-primary-fg focus:outline-none">
      <option value="" disabled>{{ placeholder() }}</option>
      @for (option of titleOptions; track option) {
        <option [value]="option">{{ option }}</option>
      }
    </select>
  `,
})
export class TitleSelectComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('Title');
  readonly disabled = input<boolean>(false);

  readonly titleOptions = TITLE_OPTIONS;
  value: string | null = null;

  private onChange: (value: string | null) => void = () => { /* noop */ };
  private onTouched: () => void = () => { /* noop */ };

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void { /* noop */ }

  onValueChange(value: string | null): void {
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
