import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CounterFields } from '@org/shared-models';
import { CardComponent, CloseButtonComponent } from '@org/ui';
import { CounterFormComponent } from './counter-form';

/**
 * The form for a new counter, shown in the panel beside the list (platform U10, sales spec R38, R39). Only the Owner reaches it
 * (the route is guarded). It reports the created counter's id; the page opens it.
 */
@Component({
  selector: 'app-counter-add',
  standalone: true,
  imports: [TranslatePipe, CardComponent, CloseButtonComponent, CounterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'counter.add.title' | translate }}</h1>
        <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
      </div>
      <app-card>
        <app-counter-form [saving]="saving()" [error]="error()" submitLabel="counter.add.submit" (submitted)="add($event)" (cancelled)="closed.emit()" />
      </app-card>
    </div>
  `,
})
export class CounterAddComponent {
  private readonly counters = inject(CounterService);
  private readonly translate = inject(TranslateService);

  readonly created = output<string>();
  readonly closed = output<void>();

  readonly saving = signal(false);
  readonly error = signal('');

  add(fields: CounterFields): void {
    this.saving.set(true);
    this.error.set('');
    this.counters.open(fields).subscribe({
      next: (counter) => {
        this.saving.set(false);
        this.created.emit(counter.id);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(error, this.translate));
      },
    });
  }
}
