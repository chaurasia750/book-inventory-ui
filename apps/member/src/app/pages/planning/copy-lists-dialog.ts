import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PlanningService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CopyBookListsResponse, SchoolSummary } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

/**
 * Planning spec R4: copy the class lists of a session in one step, from this school's previous session or from another school's
 * session. Classes that already have a list are skipped unless "replace" is ticked; student estimates are not copied.
 */
@Component({
  selector: 'app-copy-lists-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'planning.copyTitle' | translate" (closed)="closed.emit()">
      <div class="space-y-3">
        @if (mode() === 'other') {
          <div>
            <label for="cl-school" class="block text-xs font-semibold text-gray-500">{{ 'planning.fromSchool' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <input id="cl-school" type="search" [formControl]="search" autocomplete="off" [placeholder]="'sales.chooser.search' | translate"
              class="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
            <ul class="mt-1 max-h-40 divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200 dark:divide-charcoal-700 dark:border-charcoal-700">
              @for (s of schools(); track s.id) {
                <li>
                  <button type="button" (click)="fromSchool.set(s)" class="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-neutral-50" [class.bg-brand-50]="fromSchool()?.id === s.id">
                    <span class="truncate">{{ s.name }}</span><span class="font-mono text-xs text-gray-500">{{ s.code }}</span>
                  </button>
                </li>
              } @empty { <li class="px-3 py-2 text-center text-xs text-gray-400">{{ 'sales.chooser.empty' | translate }}</li> }
            </ul>
          </div>
        }
        <label class="block text-xs font-semibold text-gray-500">{{ 'planning.fromSession' | translate }}<span class="text-red-500" aria-hidden="true"> *</span>
          <input type="text" [value]="fromSession()" (input)="fromSession.set($any($event.target).value)" class="mt-1 h-10 w-40 rounded-lg border border-gray-300 px-3 font-mono text-sm" />
        </label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" [checked]="replace()" (change)="replace.set($any($event.target).checked)" class="h-4 w-4" /> {{ 'planning.replace' | translate }}</label>
        @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
          <app-button [loading]="saving()" [disabled]="!fromSession().trim() || (mode() === 'other' && !fromSchool())" (clicked)="copy()">{{ 'planning.copy' | translate }}</app-button>
        </div>
      </div>
    </app-modal>
  `,
})
export class CopyListsDialogComponent {
  readonly open = input(false);
  readonly mode = input<'last' | 'other'>('last');
  readonly schoolId = input.required<string>();
  readonly session = input.required<string>();
  readonly previousSession = input.required<string>();
  readonly closed = output<void>();
  readonly copied = output<CopyBookListsResponse>();

  private readonly planning = inject(PlanningService);
  private readonly schoolService = inject(SchoolService);
  private readonly translate = inject(TranslateService);

  readonly search = new FormControl('', { nonNullable: true });
  readonly schools = signal<SchoolSummary[]>([]);
  readonly fromSchool = signal<SchoolSummary | null>(null);
  readonly fromSession = signal('');
  readonly replace = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  constructor() {
    effect(() => {
      const open = this.open();
      const mode = this.mode();
      const previous = this.previousSession();
      const current = this.session();
      if (open) {
        untracked(() => {
          this.error.set('');
          this.fromSchool.set(null);
          this.fromSession.set(mode === 'last' ? previous : current);
          if (mode === 'other') {
            this.find('');
          }
        });
      }
    });
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef))).subscribe((t) => this.find(t));
  }

  private find(text: string): void {
    this.schoolService.list({ search: text.trim() || undefined, pageIndex: 1, pageSize: 8 }).subscribe({
      next: (p) => this.schools.set(p.items.filter((s) => s.id !== this.schoolId())),
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }

  copy(): void {
    this.saving.set(true);
    this.error.set('');
    const request = { fromSchoolId: this.mode() === 'other' ? this.fromSchool()?.id : undefined, fromSession: this.fromSession().trim(), replaceExisting: this.replace() };
    this.planning.copyBookLists(this.schoolId(), this.session(), request).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.copied.emit(r);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
