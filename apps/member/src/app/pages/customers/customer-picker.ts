import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { CustomerService } from '@org/api-services';
import { CustomerSuggestion } from '@org/shared-models';

const MIN_CHARACTERS = 2;
const TYPING_DELAY_MS = 300;

/**
 * The customer picker for a bill screen (customer spec R8, FR-CUS-03): type at least two characters of a name or a mobile number,
 * the active customers that match are suggested after a short pause, and one is chosen. When none fits, "Add a new customer" asks
 * the screen to open the add form. It only reports the choice (`chosen`) or the wish for a new customer (`addRequested`).
 */
@Component({
  selector: 'app-customer-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <label for="customer-picker" class="mb-1 block text-sm font-semibold">{{ 'customer.picker.label' | translate }}</label>
      <input
        id="customer-picker"
        type="search"
        autocomplete="off"
        [formControl]="text"
        [placeholder]="'customer.picker.placeholder' | translate"
        class="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      @if (searched()) {
        <ul class="absolute z-10 mt-1 max-h-64 w-full list-none overflow-auto rounded-xl border border-gray-200 bg-white p-0 shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
          @for (customer of suggestions(); track customer.id) {
            <li>
              <button type="button" (click)="choose(customer)" class="flex w-full flex-col px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <span class="text-sm font-medium text-primary-fg">{{ customer.name }} <span class="font-mono text-xs text-gray-500">{{ customer.code }}</span></span>
                <span class="text-xs text-gray-500">{{ customer.mobile }}@if (customer.schoolName) { , {{ customer.schoolName }} }</span>
              </button>
            </li>
          } @empty {
            <li class="px-3 py-2 text-sm text-gray-400">{{ 'customer.picker.none' | translate }}</li>
          }
          <li class="border-t border-gray-100 dark:border-charcoal-700">
            <button type="button" (click)="addRequested.emit()" class="w-full px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
              {{ 'customer.picker.addNew' | translate }}
            </button>
          </li>
        </ul>
      }
    </div>
  `,
})
export class CustomerPickerComponent {
  private readonly customers = inject(CustomerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly chosen = output<CustomerSuggestion>();
  readonly addRequested = output<void>();

  readonly text = new FormControl('', { nonNullable: true });
  readonly suggestions = signal<CustomerSuggestion[]>([]);
  readonly searched = signal(false);

  constructor() {
    this.text.valueChanges
      .pipe(
        debounceTime(TYPING_DELAY_MS),
        distinctUntilChanged(),
        switchMap((value) => {
          const trimmed = value.trim();
          if (trimmed.length < MIN_CHARACTERS) {
            this.searched.set(false);
            return of(null);
          }

          return this.customers.suggest(trimmed);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => {
          this.suggestions.set(rows ?? []);
          this.searched.set(rows !== null);
        },
        error: () => this.searched.set(false),
      });
  }

  choose(customer: CustomerSuggestion): void {
    this.text.setValue(customer.name, { emitEvent: false });
    this.searched.set(false);
    this.chosen.emit(customer);
  }
}
