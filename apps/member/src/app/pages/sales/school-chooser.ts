import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SchoolSummary } from '@org/shared-models';
import { ModalComponent } from '@org/ui';

/**
 * Sales spec R19, R27: "New order" from the Orders menu asks only for the school. Type a name or code, pick the school; the
 * order editor opens with today's date and the school's session and GST choice.
 */
@Component({
  selector: 'app-school-chooser',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'sales.chooser.title' | translate" (closed)="closed.emit()">
      <div class="space-y-3">
        <input type="search" [formControl]="search" autocomplete="off" [placeholder]="'sales.chooser.search' | translate" [attr.aria-label]="'sales.chooser.search' | translate"
          class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
        @if (error()) { <p class="text-xs text-red-600" role="alert">{{ error() }}</p> }
        <ul class="max-h-72 divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200 dark:divide-charcoal-700 dark:border-charcoal-700">
          @for (s of schools(); track s.id) {
            <li>
              <button type="button" (click)="chosen.emit(s)" class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <span class="truncate font-medium text-primary-fg">{{ s.name }}</span>
                <span class="shrink-0 font-mono text-xs text-gray-500">{{ s.code }} · {{ s.state }}</span>
              </button>
            </li>
          } @empty {
            <li class="px-3 py-4 text-center text-sm text-gray-400">{{ 'sales.chooser.empty' | translate }}</li>
          }
        </ul>
        <p class="text-xs text-gray-500">{{ 'sales.chooser.hint' | translate }}</p>
      </div>
    </app-modal>
  `,
})
export class SchoolChooserComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly chosen = output<SchoolSummary>();

  private readonly schoolService = inject(SchoolService);
  private readonly translate = inject(TranslateService);

  readonly search = new FormControl('', { nonNullable: true });
  readonly schools = signal<SchoolSummary[]>([]);
  readonly error = signal('');

  constructor() {
    this.load('');
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef))).subscribe((text) => this.load(text));
  }

  private load(text: string): void {
    this.schoolService.list({ search: text.trim() || undefined, status: 'ACTIVE', pageIndex: 1, pageSize: 10 }).subscribe({
      next: (page) => this.schools.set(page.items),
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }
}
