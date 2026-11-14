import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ItemService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemDetail, ItemFields } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { ItemFormComponent } from './item-form';

/**
 * The form to edit an item's master data, shown in the panel beside the list (platform U10, item spec R2-R5, R7, R10): the code
 * is not editable. Saving reports `saved`; closing without saving reports `closed`; the page decides where to go.
 */
@Component({
  selector: 'app-item-edit',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, SkeletonLoaderComponent, ItemFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'item.edit.title' | translate }}</h1>
        <app-close-button [label]="'item.close' | translate" (clicked)="closed.emit()" />
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
          <app-item-form [item]="item()" [saving]="saving()" [error]="error()" submitLabel="item.edit.submit" (submitted)="save($event)" (cancelled)="closed.emit()" />
        </app-card>
      }
    </div>
  `,
})
export class ItemEditComponent {
  readonly id = input.required<string>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly items = inject(ItemService);
  private readonly translate = inject(TranslateService);

  readonly item = signal<ItemDetail | null>(null);
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
    this.items.get(this.id()).subscribe({
      next: (item) => {
        this.loading.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(error, this.translate));
      },
    });
  }

  save(fields: ItemFields): void {
    this.saving.set(true);
    this.error.set('');
    this.items.edit(this.id(), fields).subscribe({
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
