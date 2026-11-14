import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SchoolDetail, SchoolFields } from '@org/shared-models';
import { schoolStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { SchoolFormComponent } from './school-form';

/**
 * One school (school spec R6-R8, R10, R12): the master data with the generated code read-only, the edit dialog, the class
 * list editor (add, rename, move, remove; a duplicate name is caught before the request) and activate / deactivate. Staff
 * see everything read-only. The API enforces every rule again; its catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-school-detail',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, SchoolFormComponent],
  templateUrl: './school-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailComponent {
  /** The school open beside the list (platform U10); a new id loads that school. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The school's name, status or code-bearing data changed: the list beside it reloads. */
  readonly changed = output<void>();

  private readonly schools = inject(SchoolService);
  private readonly translate = inject(TranslateService);

  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly school = signal<SchoolDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly editOpen = signal(false);
  readonly saving = signal(false);
  readonly editError = signal('');

  readonly classNames = signal<string[]>([]);
  readonly classesDirty = signal(false);
  readonly classesSaving = signal(false);
  readonly classesError = signal('');
  readonly newClass = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = schoolStatusBadgeClass;

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
        this.resetClasses(school);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  openEdit(): void {
    this.editError.set('');
    this.editOpen.set(true);
  }

  edit(fields: SchoolFields): void {
    this.saving.set(true);
    this.editError.set('');
    this.schools.edit(this.id(), fields).subscribe({
      next: () => {
        this.saving.set(false);
        this.editOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.editError.set(messageForError(error, this.translate));
      },
    });
  }

  setNewClass(value: string): void {
    this.newClass.set(value);
  }

  addClass(): void {
    const name = this.newClass().trim();
    if (!name) {
      return;
    }

    this.classNames.update((names) => [...names, name]);
    this.newClass.set('');
    this.classesDirty.set(true);
  }

  renameClass(index: number, value: string): void {
    this.classNames.update((names) => names.map((n, i) => (i === index ? value : n)));
    this.classesDirty.set(true);
  }

  moveClass(index: number, step: -1 | 1): void {
    const target = index + step;
    this.classNames.update((names) => {
      if (target < 0 || target >= names.length) {
        return names;
      }

      const next = [...names];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    this.classesDirty.set(true);
  }

  removeClass(index: number): void {
    this.classNames.update((names) => names.filter((_, i) => i !== index));
    this.classesDirty.set(true);
  }

  discardClasses(): void {
    const school = this.school();
    if (school) {
      this.resetClasses(school);
    }
  }

  /** R6: class names are unique within the school (case-insensitive) and not blank; checked here before the request. */
  saveClasses(): void {
    const names = this.classNames().map((n) => n.trim());
    if (names.some((n) => !n)) {
      this.classesError.set(this.translate.instant('school.classes.blank'));
      return;
    }

    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
      this.classesError.set(this.translate.instant('school.classes.duplicate'));
      return;
    }

    this.classesSaving.set(true);
    this.classesError.set('');
    this.schools.replaceClasses(this.id(), names).subscribe({
      next: () => {
        this.classesSaving.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.classesSaving.set(false);
        this.classesError.set(messageForError(error, this.translate));
      },
    });
  }

  openStatus(): void {
    this.statusError.set('');
    this.statusOpen.set(true);
  }

  changeStatus(): void {
    const school = this.school();
    if (!school) {
      return;
    }

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = school.status === 'ACTIVE' ? this.schools.deactivate(this.id()) : this.schools.activate(this.id());
    call.subscribe({
      next: () => {
        this.statusSaving.set(false);
        this.statusOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.statusSaving.set(false);
        this.statusError.set(messageForError(error, this.translate));
      },
    });
  }

  private resetClasses(school: SchoolDetail): void {
    this.classNames.set(school.classes.map((c) => c.name));
    this.classesDirty.set(false);
    this.classesError.set('');
  }
}
