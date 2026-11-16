import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, forwardRef, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SchoolService } from '@org/api-services';
import { SaleType, SchoolSummary } from '@org/shared-models';

const PAGE_SIZE = 20;
const PAUSE_MS = 250;

/**
 * The one school drop-down of the application: a field that shows the chosen school and opens a list with a search box, so a long
 * list of schools is found by typing (name or code) instead of scrolling. It is a form control (`formControlName`, `[formControl]`
 * or `ngModel`) whose value is the school's id, empty for none. Give `allLabel` to show a first row that clears the choice (a
 * filter); `activeOnly` keeps inactive schools out of the list (the default).
 */
@Component({
  selector: 'app-school-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SchoolSelectComponent), multi: true }],
  template: `
    <div class="relative">
      <button type="button" [id]="inputId()" (click)="toggle()" [disabled]="disabled()" aria-haspopup="listbox" [attr.aria-expanded]="isOpen()"
        class="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-left text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50">
        <span class="truncate" [class.text-gray-400]="!label()">{{ label() || placeholder() }}</span>
        <svg class="h-4 w-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      @if (isOpen()) {
        <div class="absolute z-30 mt-1 w-full min-w-[16rem] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
          <input #box type="search" autocomplete="off" [placeholder]="searchPlaceholder()" [attr.aria-label]="searchPlaceholder()" (input)="type(box.value)" (keydown.escape)="close()" (keydown.enter)="pickFirst($event)"
            class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none" />
          <ul role="listbox" class="m-0 mt-2 max-h-64 list-none overflow-auto p-0">
            @if (allLabel()) {
              <li><button type="button" (click)="pick(null)" class="w-full rounded-lg px-2 py-2 text-left text-sm text-gray-600 hover:bg-neutral-50 dark:hover:bg-charcoal-700">{{ allLabel() }}</button></li>
            }
            @for (school of schools(); track school.id) {
              <li role="option" [attr.aria-selected]="school.id === value()">
                <button type="button" (click)="pick(school)" class="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-charcoal-700" [class.bg-gold-50]="school.id === value()">
                  <span class="min-w-0 truncate font-medium text-primary-fg">{{ school.name }}</span>
                  <span class="shrink-0 font-mono text-xs text-gray-500">{{ school.code }}</span>
                </button>
              </li>
            } @empty {
              <li class="px-2 py-3 text-center text-sm text-gray-400">{{ emptyLabel() }}</li>
            }
            @if (total() > schools().length) {
              <li class="px-2 py-2 text-center text-xs text-gray-400">{{ moreLabel() }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class SchoolSelectComponent implements ControlValueAccessor {
  readonly placeholder = input('Choose a school');
  readonly searchPlaceholder = input('Search name or code');
  readonly emptyLabel = input('No school found');
  readonly moreLabel = input('Type to narrow the list');
  /** A first row that clears the choice, for a filter ("All schools"). */
  readonly allLabel = input('');
  readonly activeOnly = input(true);
  readonly inputId = input('');
  /** A sale type that is left out of the list (the counter form leaves out the schools that only sell by order). */
  readonly excludeSaleType = input<SaleType | null>(null);
  /** The chosen school's name and code, for a parent that keeps its own rule on the choice. */
  readonly picked = output<SchoolSummary | null>();

  private readonly schoolService = inject(SchoolService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  private readonly search$ = new Subject<string>();

  readonly isOpen = signal(false);
  readonly disabled = signal(false);
  readonly value = signal('');
  readonly label = signal('');
  readonly schools = signal<SchoolSummary[]>([]);
  readonly total = signal(0);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.search$
      .pipe(
        debounceTime(PAUSE_MS),
        distinctUntilChanged(),
        switchMap((text) => this.schoolService.list({ search: text.trim() || undefined, status: this.activeOnly() ? 'ACTIVE' : undefined, orderBy: 'Name ASC', pageIndex: 1, pageSize: PAGE_SIZE })),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (page) => this.show(page.items, page.totalCount),
        error: () => this.schools.set([]),
      });
  }

  writeValue(id: string | null): void {
    this.value.set(id ?? '');
    if (!id) {
      this.label.set('');
      return;
    }

    const known = this.schools().find((s) => s.id === id);
    if (known) {
      this.label.set(known.name);
      return;
    }

    this.schoolService.get(id).subscribe({ next: (school) => this.label.set(school.name), error: () => this.label.set('') });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }

    this.isOpen.set(true);
    this.search$.next('');
    this.loadNow('');
    setTimeout(() => this.box()?.nativeElement.focus());
  }

  close(): void {
    this.isOpen.set(false);
    this.onTouched();
  }

  type(text: string): void {
    this.search$.next(text);
  }

  pickFirst(event: Event): void {
    event.preventDefault();
    const first = this.schools()[0];
    if (first) {
      this.pick(first);
    }
  }

  pick(school: SchoolSummary | null): void {
    this.value.set(school?.id ?? '');
    this.label.set(school?.name ?? '');
    this.onChange(school?.id ?? '');
    this.picked.emit(school);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private show(items: SchoolSummary[], total: number): void {
    const left = this.excludeSaleType();
    this.schools.set(left ? items.filter((s) => s.saleType !== left) : items);
    this.total.set(total);
  }

  /** The list is there the moment the field opens, without waiting for the pause of the search box. */
  private loadNow(text: string): void {
    this.schoolService
      .list({ search: text || undefined, status: this.activeOnly() ? 'ACTIVE' : undefined, orderBy: 'Name ASC', pageIndex: 1, pageSize: PAGE_SIZE })
      .subscribe({
        next: (page) => this.show(page.items, page.totalCount),
        error: () => this.schools.set([]),
      });
  }
}
