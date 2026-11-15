import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CALENDAR_WIDTH = 288;
const CALENDAR_HEIGHT = 300;
const GAP = 4;

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.15s ease-out;
    }
  `],
  template: `
    <div class="relative w-full" tabindex="-1" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
      @if (label) {
        <span class="absolute text-xs text-gray-500 dark:text-gray-400 duration-150 transform -translate-y-2.5 scale-75 top-3.5 z-10 origin-[0] left-3"
          [class.text-saffron-500]="isOpen()">
          {{ label }} <span class="text-red-500">*</span>
        </span>
      }
      <div class="relative">
        <input type="text" readonly [attr.id]="inputId || null" [value]="displayValue" [placeholder]="placeholder"
          (click)="toggle()"
          [class]="(label ? 'pb-2 pt-4 ' : 'h-10 py-0 ') + (error
            ? 'peer block w-full appearance-none rounded-lg border px-3 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2 border-red-400 bg-red-500/5 focus:border-red-400 focus:ring-red-400/20'
            : 'peer block w-full appearance-none rounded-lg border px-3 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2 border-gray-300 focus:border-brand-500 focus:ring-brand-500/20 bg-transparent')" />
        <button type="button" (click)="toggle()"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="fixed z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg animate-fade-in p-3" [style.top.px]="popupTop()" [style.left.px]="popupLeft()">
          <!-- Header: Month/Year nav -->
          <div class="flex items-center justify-between mb-3">
            <button type="button" (click)="prevMonth()"
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="flex items-center gap-2">
              <select [value]="viewMonth()" (change)="onMonthChange($event)"
                class="text-sm font-semibold text-gray-800 dark:text-white bg-transparent border-0 cursor-pointer focus:outline-none">
                @for (m of months; track $index) {
                  <option [value]="$index" [selected]="$index === viewMonth()">{{ m }}</option>
                }
              </select>
              <select [value]="viewYear()" (change)="onYearChange($event)"
                class="text-sm font-semibold text-gray-800 dark:text-white bg-transparent border-0 cursor-pointer focus:outline-none">
                @for (y of yearRange; track y) {
                  <option [value]="y" [selected]="y === viewYear()">{{ y }}</option>
                }
              </select>
            </div>
            <button type="button" (click)="nextMonth()"
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-1">
            @for (d of days; track d) {
              <div class="text-center text-[10px] font-medium text-gray-400 py-1">{{ d }}</div>
            }
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-0.5">
            @for (blank of blankDays; track blank) {
              <div></div>
            }
            @for (day of daysInMonth; track day) {
              <button type="button" (click)="selectDate(day)"
                class="h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-colors"
                [class.font-bold]="isSelected(day)"
                [class.bg-saffron-500]="isSelected(day)"
                [class.text-white]="isSelected(day)"
                [class.hover:bg-saffron-50]="!isSelected(day)"
                [class.text-gray-700]="!isToday(day)"
                [class.dark:text-gray-300]="!isToday(day)"
                [class.text-saffron-600]="isToday(day) && !isSelected(day)"
                [class.font-semibold]="isToday(day) && !isSelected(day)"
                [class.ring-1]="isToday(day) && !isSelected(day)"
                [class.ring-saffron-400]="isToday(day) && !isSelected(day)">
                {{ day }}
              </button>
            }
          </div>

          <!-- Footer: Today + Clear -->
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" (click)="goToday()"
              class="text-[11px] font-medium text-saffron-600 hover:text-saffron-700 transition-colors">
              Today
            </button>
            <button type="button" (click)="clearDate()"
              class="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
              Clear
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
/**
 * The calendar is `position: fixed` and placed from the input's own rectangle (below it, or above it when there is no room), so it is
 * never clipped by a scrolling dialog or card around the field.
 */
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() label = '';
  @Input() placeholder = 'DD/MM/YYYY';
  @Input() error = false;
  /** The id of the inner input, so a page's own <label for> points at it. */
  @Input() inputId = '';

  @Output() valueChange = new EventEmitter<string>();

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly months = MONTHS;
  readonly days = DAYS;

  readonly isOpen = signal(false);
  readonly popupTop = signal(0);
  readonly popupLeft = signal(0);
  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  private _selectedDate: Date | null = null;

  private _today = new Date();
  private readonly replace = (): void => this.place();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  get displayValue(): string {
    if (!this._selectedDate) return '';
    return this.formatDate(this._selectedDate);
  }

  get yearRange(): number[] {
    const cy = this._today.getFullYear();
    const years: number[] = [];
    for (let y = cy - 50; y <= cy + 10; y++) {
      years.push(y);
    }
    return years;
  }

  get blankDays(): number[] {
    const firstDay = new Date(this.viewYear(), this.viewMonth(), 1).getDay();
    return Array.from({ length: firstDay }, (_, i) => i);
  }

  get daysInMonth(): number[] {
    const count = new Date(this.viewYear(), this.viewMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  isSelected(day: number): boolean {
    if (!this._selectedDate) return false;
    return (
      day === this._selectedDate.getDate() &&
      this.viewMonth() === this._selectedDate.getMonth() &&
      this.viewYear() === this._selectedDate.getFullYear()
    );
  }

  isToday(day: number): boolean {
    return (
      day === this._today.getDate() &&
      this.viewMonth() === this._today.getMonth() &&
      this.viewYear() === this._today.getFullYear()
    );
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isOpen()) {
      this.close();
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  writeValue(val: string): void {
    if (val) {
      const d = this.parseDate(val);
      if (d) {
        this._selectedDate = d;
        this.viewMonth.set(d.getMonth());
        this.viewYear.set(d.getFullYear());
      }
    } else {
      this._selectedDate = null;
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.openCalendar();
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.stopFollowing();
  }

  private openCalendar(): void {
    if (this._selectedDate) {
      this.viewMonth.set(this._selectedDate.getMonth());
      this.viewYear.set(this._selectedDate.getFullYear());
    }
    this.place();
    this.isOpen.set(true);
    window.addEventListener('scroll', this.replace, true);
    window.addEventListener('resize', this.replace);
  }

  private close(): void {
    this.isOpen.set(false);
    this.stopFollowing();
  }

  private stopFollowing(): void {
    window.removeEventListener('scroll', this.replace, true);
    window.removeEventListener('resize', this.replace);
  }

  /** Below the field when the calendar fits there, else above it; when it fits neither, kept fully inside the window (over the field). Sideways it is kept inside the window too. */
  private place(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const below = rect.bottom + GAP;
    const above = rect.top - CALENDAR_HEIGHT - GAP;
    const top = below + CALENDAR_HEIGHT <= window.innerHeight ? below : above >= GAP ? above : window.innerHeight - CALENDAR_HEIGHT - GAP;
    this.popupTop.set(Math.max(GAP, top));
    this.popupLeft.set(Math.max(GAP, Math.min(rect.left, window.innerWidth - CALENDAR_WIDTH - GAP)));
    this.cdr.markForCheck();
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.set(this.viewYear() - 1);
    } else {
      this.viewMonth.set(this.viewMonth() - 1);
    }
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.set(this.viewYear() + 1);
    } else {
      this.viewMonth.set(this.viewMonth() + 1);
    }
    this.cdr.markForCheck();
  }

  onMonthChange(event: Event): void {
    this.viewMonth.set(Number((event.target as HTMLSelectElement).value));
    this.cdr.markForCheck();
  }

  onYearChange(event: Event): void {
    this.viewYear.set(Number((event.target as HTMLSelectElement).value));
    this.cdr.markForCheck();
  }

  selectDate(day: number): void {
    this._selectedDate = new Date(this.viewYear(), this.viewMonth(), day);
    this.isOpen.set(false);
    const formatted = this.formatDateISO(this._selectedDate);
    this.onChange(formatted);
    this.valueChange.emit(formatted);
    this.onTouched();
    this.cdr.markForCheck();
  }

  goToday(): void {
    const today = new Date();
    this.viewMonth.set(today.getMonth());
    this.viewYear.set(today.getFullYear());
    this.selectDate(today.getDate());
  }

  clearDate(): void {
    this._selectedDate = null;
    this.isOpen.set(false);
    this.onChange('');
    this.valueChange.emit('');
    this.onTouched();
    this.cdr.markForCheck();
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatDateISO(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  private parseDate(val: string): Date | null {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  }
}
