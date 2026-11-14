import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SchoolDetail, SchoolFields } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { SchoolFormComponent } from './school-form';

/**
 * The form to edit a school's master data, shown in the panel beside the list (platform U10, school spec R7, R15): the
 * code is not editable. Saving reports `saved`; closing without saving reports `closed`; the page decides where to go.
 */
@Component({
  selector: 'app-school-edit',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent, SchoolFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'school.edit.title' | translate }}</h1>
        <app-close-button [label]="'school.close' | translate" (clicked)="closed.emit()" />
      </div>
      @if (loading()) {
        <app-card><app-skeleton-loader width="100%" /></app-card>
      } @else if (loadError()) {
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span>
          <app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else {
        <app-card>
          <app-school-form [school]="school()" [saving]="saving()" [error]="error()" submitLabel="school.edit.submit" (submitted)="save($event)" (cancelled)="closed.emit()" />
        </app-card>
      }
    </div>
  `,
})
export class SchoolEditComponent {
  readonly id = input.required<string>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly schools = inject(SchoolService);
  private readonly translate = inject(TranslateService);

  readonly school = signal<SchoolDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.schools.get(this.id()).subscribe({
      next: (school) => {
        this.loading.set(false);
        this.school.set(school);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  save(fields: SchoolFields): void {
    this.saving.set(true);
    this.error.set('');
    this.schools.edit(this.id(), fields).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(error, this.translate));
      },
    });
  }
}
