import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-amount-slider',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium text-primary-fg">Expected Amount (\u20B9)</label>
        <span class="text-sm font-bold text-[#66B42A]">{{ formatValue(value) }}</span>
      </div>
      <input type="range" [ngModel]="value" (ngModelChange)="onInput($event)" min="0" max="10000000" step="10000"
        class="h-2 w-full appearance-none rounded-full cursor-pointer accent-[#66B42A]"
        [style]="'background: linear-gradient(to right, #66B42A ' + percent + '%, #E2E5E9 ' + percent + '%);'">
      <div class="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>\u20B90</span>
        <span>\u20B91Cr</span>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountSliderComponent),
      multi: true,
    },
  ],
})
export class AmountSliderComponent implements ControlValueAccessor {
  value = 0;
  percent = 0;
  disabled = false;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value || 0;
    this.percent = Math.min(100, (this.value / 10000000) * 100);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(val: number): void {
    this.value = val;
    this.percent = Math.min(100, (val / 10000000) * 100);
    this.onChange(val);
    this.onTouched();
  }

  formatValue(val: number): string {
    if (val >= 10000000) return '\u20B9' + (val / 10000000).toFixed(2) + ' Cr';
    if (val >= 100000) return '\u20B9' + (val / 100000).toFixed(1) + ' L';
    if (val >= 1000) return '\u20B9' + (val / 1000).toFixed(0) + ' K';
    return '\u20B9' + val;
  }
}
