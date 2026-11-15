import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PlanningService, SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { AddLinesResponse, ClassBookListView } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

interface SetRow {
  className: string;
  books: number;
  hasList: boolean;
  checked: boolean;
  students: number;
}

/**
 * Sales spec R22: "Add class sets". Every class of the school with its book list of the order's session: tick the classes, write
 * how many students (prefilled with the planning estimate) and every book of the list is added, students x copies per student.
 * Books the server could not add (no price, inactive) are shown, never silently dropped.
 */
@Component({
  selector: 'app-class-set-dialog',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'sales.classSets.title' | translate" (closed)="closed.emit()">
      <div class="space-y-3">
        <p class="text-xs text-gray-500">{{ 'sales.classSets.hint' | translate }}</p>
        @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        <ul class="max-h-80 divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200 dark:divide-charcoal-700 dark:border-charcoal-700">
          @for (r of rows(); track r.className; let i = $index) {
            <li class="flex items-center gap-3 px-3 py-2 text-sm" [class.opacity-50]="!r.hasList">
              <input type="checkbox" [id]="'cs-' + i" [checked]="r.checked" [disabled]="!r.hasList" (change)="set(i, { checked: $any($event.target).checked })" class="h-4 w-4" />
              <label [for]="'cs-' + i" class="flex-1">
                <span class="font-medium text-primary-fg">{{ r.className }}</span>
                <span class="ml-2 text-xs text-gray-500">{{ r.hasList ? r.books + ' ' + ('sales.classSets.books' | translate) : ('sales.classSets.noList' | translate: { session: session() }) }}</span>
              </label>
              @if (r.hasList) {
                <label class="flex items-center gap-1 text-xs text-gray-500">{{ 'sales.classSets.students' | translate }}
                  <input type="number" min="1" max="5000" step="1" [value]="r.students" (change)="set(i, { students: +$any($event.target).value, checked: true })"
                    class="h-8 w-20 rounded border border-gray-300 px-2 text-right text-xs" />
                </label>
              }
            </li>
          }
        </ul>
        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
          <app-button [loading]="saving()" [disabled]="chosen().length === 0" (clicked)="add()">{{ 'sales.classSets.add' | translate }}</app-button>
        </div>
      </div>
    </app-modal>
  `,
})
export class ClassSetDialogComponent {
  readonly open = input(false);
  readonly orderId = input.required<string>();
  readonly schoolId = input.required<string>();
  readonly session = input.required<string>();
  readonly closed = output<void>();
  readonly added = output<AddLinesResponse>();

  private readonly planning = inject(PlanningService);
  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<SetRow[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const open = this.open();
      const schoolId = this.schoolId();
      const session = this.session();
      if (open) {
        untracked(() => this.load(schoolId, session));
      }
    });
  }

  chosen(): SetRow[] {
    return this.rows().filter((r) => r.checked && r.students > 0);
  }

  set(index: number, patch: Partial<SetRow>): void {
    this.rows.update((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  add(): void {
    this.saving.set(true);
    this.error.set('');
    this.sales.addClassSets(this.orderId(), { classes: this.chosen().map((r) => ({ className: r.className, students: r.students })) }).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.added.emit(r);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  private load(schoolId: string, session: string): void {
    this.error.set('');
    this.planning.bookLists(schoolId, session).subscribe({
      next: (lists) => this.rows.set(lists.classes.map(rowOf)),
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }
}

function rowOf(c: ClassBookListView): SetRow {
  return { className: c.className, books: c.lines.length, hasList: c.hasList && c.lines.length > 0, checked: false, students: c.studentEstimate ?? 0 };
}
