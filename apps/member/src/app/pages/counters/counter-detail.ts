import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Counter } from '@org/shared-models';
import { counterStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

/**
 * One counter's page (sales spec R38, R39, R49): its name, school, session, dates and status. The Owner edits it and closes or opens
 * it; Staff only read it (R48). "Open billing" opens the counter's billing screen (sales#18). The API enforces every rule again; its
 * catalogue message is shown on a refusal.
 */
@Component({
  selector: 'app-counter-detail',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (loading()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <app-card>
          <div class="space-y-3">
            <app-skeleton-loader width="14rem" />
            <app-skeleton-loader width="100%" />
            <app-skeleton-loader width="80%" />
          </div>
        </app-card>
      } @else if (loadError()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span>
          <app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (counter(); as c) {
        <section class="flex flex-col gap-3 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2.5">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 text-xl font-semibold text-primary-fg">{{ c.name }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(c.status)">{{ 'counter.status.' + c.status | translate }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{{ c.schoolName || '-' }}@if (c.schoolCode) { <span class="font-mono"> ({{ c.schoolCode }})</span> }</span>
                <span>{{ 'counter.fields.session' | translate }}: <span class="font-mono">{{ c.session }}</span></span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <app-button size="sm" (clicked)="billRequested.emit()">{{ 'counter.openBilling' | translate }}</app-button>
              @if (canEdit) {
                <app-button size="sm" variant="secondary" (clicked)="editRequested.emit()">{{ 'counter.edit.button' | translate }}</app-button>
                <app-button size="sm" variant="secondary" (clicked)="openStatus()">
                  {{ (c.status === 'ACTIVE' ? 'counter.close.button' : 'counter.open.button') | translate }}
                </app-button>
              }
              <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
          <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'counter.fields.startDate' | translate }}</dt><dd class="mt-0.5 text-[13px] text-primary-fg"><span class="font-mono">{{ c.startDate }}</span></dd></div>
            <div><dt class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'counter.fields.endDate' | translate }}</dt><dd class="mt-0.5 text-[13px] text-primary-fg">@if (c.endDate) { <span class="font-mono">{{ c.endDate }}</span> } @else { {{ 'counter.fields.none' | translate }} }</dd></div>
            <div><dt class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'counter.fields.session' | translate }}</dt><dd class="mt-0.5 text-[13px] text-primary-fg"><span class="font-mono">{{ c.session }}</span></dd></div>
            <div><dt class="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'counter.fields.school' | translate }}</dt><dd class="mt-0.5 text-[13px] text-primary-fg">{{ c.schoolName || '-' }}</dd></div>
          </dl>
        </section>

        <app-modal [open]="statusOpen()" [title]="(c.status === 'ACTIVE' ? 'counter.close.title' : 'counter.open.title') | translate" (closed)="statusOpen.set(false)">
          <div class="space-y-4">
            <p class="text-sm text-gray-600">{{ (c.status === 'ACTIVE' ? 'counter.close.confirm' : 'counter.open.confirm') | translate }}</p>
            @if (statusError()) {
              <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ statusError() }}</p>
            }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="statusOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button [loading]="statusSaving()" (clicked)="changeStatus()">{{ (c.status === 'ACTIVE' ? 'counter.close.button' : 'counter.open.button') | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class CounterDetailComponent {
  /** The counter open beside the list (platform U10); a new id loads that counter. */
  readonly id = input.required<string>();
  /** The X: the list shows full width again. */
  readonly closed = output<void>();
  /** The counter's status changed: the list beside it reloads. */
  readonly changed = output<void>();
  /** The Edit button: the page opens the edit form in the panel. */
  readonly editRequested = output<void>();
  /** The Open billing button: the page opens the billing screen. */
  readonly billRequested = output<void>();

  private readonly counters = inject(CounterService);
  private readonly translate = inject(TranslateService);

  /** Sales R48: Staff read but never change a counter. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  readonly counter = signal<Counter | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly statusOpen = signal(false);
  readonly statusSaving = signal(false);
  readonly statusError = signal('');

  statusClass = counterStatusBadgeClass;

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

  openStatus(): void {
    this.statusError.set('');
    this.statusOpen.set(true);
  }

  changeStatus(): void {
    const counter = this.counter();
    if (!counter) return;

    this.statusSaving.set(true);
    this.statusError.set('');
    const call = counter.status === 'ACTIVE' ? this.counters.close(this.id()) : this.counters.reopen(this.id());
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
}
