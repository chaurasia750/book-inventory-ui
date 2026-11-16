import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalesService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Counter, CounterFields, SchoolSummary } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';
const SCHOOL_CHOICES = 200;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The counter form (sales spec R38, R39) shared by the add and the edit panel: the school (only schools that sell at the counter,
 * R38), the session choice of the school's session on the start date (school R18, as for an order), the start date, the optional end
 * date and the name (with the suggested `<school> Counter <session>`). Once a counter has a bill its school cannot change (R39), so
 * the school select is locked then. The API checks everything again and its catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-counter-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
      @if (error()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
      }
      @if (loadError()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ loadError() }}</p>
      }
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="ctf-school" class="mb-1 block text-sm font-semibold">{{ 'counter.fields.school' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <select id="ctf-school" formControlName="schoolId" (change)="schoolChanged()" class="${FIELD} disabled:cursor-not-allowed disabled:bg-gray-100">
            <option value="">{{ 'counter.fields.noSchool' | translate }}</option>
            @for (school of schools(); track school.id) { <option [value]="school.id">{{ school.name }}</option> }
          </select>
          @if (schoolLocked()) {
            <p class="mt-1 text-xs text-gray-500">{{ 'counter.fields.schoolLocked' | translate }}</p>
          }
        </div>
        <div>
          <label for="ctf-start" class="mb-1 block text-sm font-semibold">{{ 'counter.fields.startDate' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <input id="ctf-start" type="date" formControlName="startDate" (change)="datesChanged()" class="${FIELD}" />
        </div>
        <div>
          <label for="ctf-end" class="mb-1 block text-sm font-semibold">{{ 'counter.fields.endDate' | translate }}</label>
          <input id="ctf-end" type="date" formControlName="endDate" class="${FIELD}" />
          @if (endBeforeStart()) {
            <p class="mt-1 text-xs text-red-600" role="alert">{{ 'counter.fields.endBeforeStart' | translate }}</p>
          }
        </div>
        <div>
          <label for="ctf-session" class="mb-1 block text-sm font-semibold">{{ 'counter.fields.session' | translate }}</label>
          <select id="ctf-session" formControlName="session" (change)="sessionChanged()" class="${FIELD}">
            @for (name of sessions(); track name) { <option [value]="name">{{ name }}</option> }
          </select>
        </div>
        <div>
          <label for="ctf-name" class="mb-1 block text-sm font-semibold">{{ 'counter.fields.name' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <input id="ctf-name" formControlName="name" (input)="nameEdited()" class="${FIELD}" />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <app-button variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button type="submit" [loading]="saving()">{{ submitLabel() | translate }}</app-button>
      </div>
    </form>
  `,
})
export class CounterFormComponent {
  private readonly schoolService = inject(SchoolService);
  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** The counter being edited, or null for a new one. */
  counter = input<Counter | null>(null);
  saving = input(false);
  error = input('');
  submitLabel = input('counter.add.submit');

  submitted = output<CounterFields>();
  cancelled = output<void>();

  readonly schools = signal<SchoolSummary[]>([]);
  readonly sessions = signal<string[]>([]);
  readonly loadError = signal('');

  /** The name the form last suggested, so a manual edit is not overwritten (R38). */
  private suggestion = '';
  private nameTouched = false;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)] }),
    schoolId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl(today(), { nonNullable: true, validators: [Validators.required] }),
    session: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
  });

  readonly schoolLocked = signal(false);

  constructor() {
    this.loadSchools();
    effect(() => {
      const c = this.counter();
      untracked(() => this.fill(c));
    });
  }

  endBeforeStart(): boolean {
    const v = this.form.getRawValue();
    return !!v.startDate && !!v.endDate && v.endDate < v.startDate;
  }

  private fill(c: Counter | null): void {
    this.nameTouched = false;
    this.schoolLocked.set(!!c?.hasBills);
    this.form.reset({
      name: c?.name ?? '',
      schoolId: c?.schoolId ?? '',
      startDate: c?.startDate ?? today(),
      session: c?.session ?? '',
      endDate: c?.endDate ?? '',
    });
    if (this.schoolLocked()) {
      this.form.controls.schoolId.disable();
    } else {
      this.form.controls.schoolId.enable();
    }
    this.suggestion = c?.name ?? '';
    this.loadSessions(c?.session ?? '');
  }

  schoolChanged(): void {
    this.loadSessions('');
  }

  datesChanged(): void {
    this.loadSessions(this.form.controls.session.value);
  }

  sessionChanged(): void {
    this.suggestName();
  }

  nameEdited(): void {
    this.nameTouched = true;
  }

  submit(): void {
    if (this.form.invalid || this.saving() || this.endBeforeStart()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name.trim(),
      schoolId: v.schoolId,
      startDate: v.startDate,
      session: v.session || undefined,
      endDate: v.endDate || undefined,
    });
  }

  /** R38: only active schools whose sale type is `COUNTER_SALE` or `BOTH` can have a counter. */
  private loadSchools(): void {
    this.schoolService
      .list({ status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: SCHOOL_CHOICES })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.schools.set(page.items.filter((s) => s.saleType !== 'SCHOOL_ORDER')),
        error: (error: unknown) => this.loadError.set(messageForError(error, this.translate)),
      });
  }

  /** R38: the session is the school's session on the start date unless the Owner chooses the one before or after it (school R18). */
  private loadSessions(selected: string): void {
    const schoolId = this.form.controls.schoolId.value;
    const startDate = this.form.controls.startDate.value;
    if (!schoolId || !startDate) {
      this.sessions.set(selected ? [selected] : []);
      return;
    }

    this.sales
      .sessionChoice(schoolId, startDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (choice) => {
          const names = Array.from(new Set([choice.previous, choice.session, choice.next].filter((s) => !!s)));
          if (selected && !names.includes(selected)) names.push(selected);
          this.sessions.set(names);
          if (!selected || !names.includes(selected)) {
            this.form.controls.session.setValue(choice.session);
          }
          this.suggestName();
        },
        // The session of an existing counter stays as it is when the choice cannot be read; the server checks it on every save.
        error: () => {
          this.sessions.set(selected ? [selected] : []);
          this.suggestName();
        },
      });
  }

  /** R38: a suggested name `<school> Counter <session>`; a name the Owner typed is kept. */
  private suggestName(): void {
    const schoolId = this.form.controls.schoolId.value;
    const session = this.form.controls.session.value;
    const school = this.schools().find((s) => s.id === schoolId);
    if (!school) return;
    const next = session ? `${school.name} Counter ${session}` : `${school.name} Counter`;
    if (!this.nameTouched && (this.form.controls.name.value === '' || this.form.controls.name.value === this.suggestion)) {
      this.form.controls.name.setValue(next);
    }
    this.suggestion = next;
  }
}
