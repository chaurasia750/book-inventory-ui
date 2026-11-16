import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Counter, CounterFields } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { CounterFormComponent } from './counter-form';

/**
 * The form to edit a counter (sales spec R38, R39), shown in the panel beside the list (platform U10): the school cannot change once
 * the counter has a bill. Saving reports `saved`; closing without saving reports `closed`; the page decides where to go.
 */
@Component({
  selector: 'app-counter-edit',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent, CounterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'counter.edit.title' | translate }}</h1>
        <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
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
          <app-counter-form [counter]="counter()" [saving]="saving()" [error]="error()" submitLabel="counter.edit.submit" (submitted)="save($event)" (cancelled)="closed.emit()" />
        </app-card>
      }
    </div>
  `,
})
export class CounterEditComponent {
  readonly id = input.required<string>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly counters = inject(CounterService);
  private readonly translate = inject(TranslateService);

  readonly counter = signal<Counter | null>(null);
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
    this.counters.get(this.id()).subscribe({
      next: (counter) => {
        this.loading.set(false);
        this.counter.set(counter);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  save(fields: CounterFields): void {
    this.saving.set(true);
    this.error.set('');
    this.counters.edit(this.id(), fields).subscribe({
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
