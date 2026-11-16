import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CounterService } from '@org/api-services';
import { StudentInput, StudentSuggestion } from '@org/shared-models';

/** What the student box tells the billing page: an existing student (id) or a new one (fields), with the effective class for the book list. */
export interface StudentSelection {
  studentId: string | null;
  student: StudentInput | null;
  className: string;
  displayName: string;
}

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';
const PAUSE_MS = 250;

/**
 * The student box of the counter billing screen (sales spec R40, R41): typing a name suggests the school's students (name, class,
 * section) and picking one reuses it; a new name asks for the class (required) and the optional section, roll number and parent
 * mobile. The API checks the same rules again (the name and class are the identity, R40).
 */
@Component({
  selector: 'app-counter-student-box',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="relative sm:col-span-2">
        <label for="csb-name" class="mb-1 block text-sm font-semibold">{{ 'counter.student.name' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
        <input #box id="csb-name" type="text" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="csb-suggestions" [attr.aria-expanded]="suggestions().length > 0"
          [formControl]="name" (input)="onInput(box.value)" (keydown.escape)="close()" [placeholder]="'counter.student.nameHint' | translate" [class]="field" />
        @if (picked(); as p) {
          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
            <span>{{ 'counter.student.reusing' | translate: { name: p.name, className: p.className } }}</span>
            <button type="button" class="font-semibold underline" (click)="clearPick()">{{ 'counter.student.change' | translate }}</button>
          </div>
        }
        @if (suggestions().length > 0) {
          <ul id="csb-suggestions" role="listbox" class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
            @for (s of suggestions(); track s.id) {
              <li role="option" aria-selected="false">
                <button type="button" (click)="pick(s)" class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium">{{ s.name }}</span>
                    <span class="text-xs text-gray-500">{{ s.className }}@if (s.section) { · {{ s.section }} }@if (s.rollNumber) { · {{ 'counter.student.roll' | translate }} {{ s.rollNumber }} }</span>
                  </span>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      @if (!picked()) {
        <div>
          <label for="csb-class" class="mb-1 block text-sm font-semibold">{{ 'counter.student.class' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <select id="csb-class" [formControl]="className" [class]="field">
            <option value="">{{ 'counter.student.noClass' | translate }}</option>
            @for (c of classes(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </div>
        <div>
          <label for="csb-section" class="mb-1 block text-sm font-semibold">{{ 'counter.student.section' | translate }}</label>
          <input id="csb-section" type="text" [formControl]="section" [class]="field" />
        </div>
        <div>
          <label for="csb-roll" class="mb-1 block text-sm font-semibold">{{ 'counter.student.roll' | translate }}</label>
          <input id="csb-roll" type="text" [formControl]="roll" [class]="field" />
        </div>
        <div>
          <label for="csb-mobile" class="mb-1 block text-sm font-semibold">{{ 'counter.student.parentMobile' | translate }}</label>
          <input id="csb-mobile" type="tel" [formControl]="mobile" [class]="field" />
        </div>
      }
    </div>
  `,
})
export class CounterStudentBoxComponent {
  private readonly counters = inject(CounterService);
  private readonly destroyRef = inject(DestroyRef);

  readonly schoolId = input.required<string>();
  readonly classes = input<string[]>([]);
  readonly changed = output<StudentSelection | null>();

  readonly field = FIELD;
  readonly name = new FormControl('', { nonNullable: true });
  readonly className = new FormControl('', { nonNullable: true });
  readonly section = new FormControl('', { nonNullable: true });
  readonly roll = new FormControl('', { nonNullable: true });
  readonly mobile = new FormControl('', { nonNullable: true });

  readonly suggestions = signal<StudentSuggestion[]>([]);
  readonly picked = signal<StudentSuggestion | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.name.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emit());
    this.className.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emit());
    this.section.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emit());
    this.roll.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emit());
    this.mobile.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emit());
    // R41: the suggestions belong to the school on screen; a change clears them.
    effect(() => {
      this.schoolId();
      untracked(() => {
        this.close();
        this.emit();
      });
    });
  }

  /** R41: lists the school's matches while a name is typed (after a short pause, from two characters). */
  onInput(text: string): void {
    clearTimeout(this.timer);
    const search = text.trim();
    if (search.length < 2) {
      this.close();
      return;
    }
    this.timer = setTimeout(() => this.load(search), PAUSE_MS);
  }

  /** R40, R41: picking a suggestion reuses that student; the class comes with it. */
  pick(suggestion: StudentSuggestion): void {
    this.picked.set(suggestion);
    this.name.setValue(suggestion.name);
    this.close();
    this.emit();
  }

  clearPick(): void {
    this.picked.set(null);
    this.close();
    this.emit();
  }

  close(): void {
    clearTimeout(this.timer);
    this.suggestions.set([]);
  }

  private load(search: string): void {
    this.counters.suggestStudents(this.schoolId(), search).subscribe({
      next: (rows) => {
        if (this.name.value.trim() !== search || this.picked()) return;
        this.suggestions.set(rows);
      },
      error: () => this.suggestions.set([]),
    });
  }

  private emit(): void {
    const picked = this.picked();
    if (picked) {
      this.changed.emit({ studentId: picked.id, student: null, className: picked.className, displayName: picked.name });
      return;
    }

    const name = this.name.value.trim();
    const className = this.className.value;
    if (!name || !className) {
      this.changed.emit(null);
      return;
    }
    this.changed.emit({
      studentId: null,
      student: {
        name,
        className,
        section: this.section.value.trim() || undefined,
        rollNumber: this.roll.value.trim() || undefined,
        parentMobile: this.mobile.value.trim() || undefined,
      },
      className,
      displayName: name,
    });
  }
}
