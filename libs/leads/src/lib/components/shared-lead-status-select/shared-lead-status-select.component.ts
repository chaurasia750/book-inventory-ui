import { ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LeadsService } from '../../services/leads.service';
import { LeadLookupItem } from '../../models/lead-api.model';

@Component({
  selector: 'app-shared-lead-status-select',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select (change)="onSelect($event)" [disabled]="disabled"
      class="block w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 cursor-pointer h-10 border-gray-200 text-gray-700 focus:border-[#66B42A] focus:ring-[#66B42A]/20">
      @if (loading) {
        <option value="" disabled selected>Loading...</option>
      } @else {
        <option value="" disabled selected>{{ placeholderText }}</option>
        @for (st of statuses; track st.id) {
          <option [value]="st.id" [selected]="value === st.id">{{ st.name }}</option>
        }
      }
    </select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedLeadStatusSelectComponent),
      multi: true,
    },
  ],
})
export class SharedLeadStatusSelectComponent implements ControlValueAccessor, OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);

  placeholderText = 'Select status';
  statuses: LeadLookupItem[] = [];
  value: number | string = '';
  disabled = false;
  loading = true;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.leadsService.getLeadStatusLookup().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => { this.statuses = data; this.loading = false; },
      error: () => { this.statuses = []; this.loading = false; },
    });
  }

  writeValue(value: any): void { this.value = value ?? ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value;
    const num = parseInt(val, 10);
    this.value = isNaN(num) ? val : num;
    this.onChange(this.value);
    this.onTouched();
  }
}
