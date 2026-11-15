import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { SessionCutOffs } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const SELECT = 'h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none';

/**
 * The company's session cut-offs (school spec R19, BRD Q-05), a tab of the Company profile for the Owner: the day and month from which an
 * Apr-Mar school's dates and a Jan-Dec school's dates belong to the next session. The server checks the day and the month range.
 */
@Component({
  selector: 'app-session-cut-offs',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-2xl flex-col gap-3">
      <p class="m-0 text-sm text-gray-500">{{ 'sales.cutOffs.subtitle' | translate }}</p>
      @if (value(); as v) {
        <section class="flex flex-col gap-4">
          @for (row of rows; track row.key) {
            <div>
              <span class="mb-1 block text-sm font-semibold">{{ 'sales.cutOffs.' + row.key | translate }}<span class="text-red-500" aria-hidden="true"> *</span></span>
              <div class="flex gap-2">
                <select [value]="day(row.key)" (change)="set(row.key, 'day', +$any($event.target).value)" [class]="select" [attr.aria-label]="'sales.cutOffs.day' | translate">
                  @for (d of days; track d) { <option [value]="d">{{ d }}</option> }
                </select>
                <select [value]="month(row.key)" (change)="set(row.key, 'month', +$any($event.target).value)" [class]="select" [attr.aria-label]="'sales.cutOffs.month' | translate">
                  @for (m of row.months; track m) { <option [value]="m">{{ 'sales.months.' + m | translate }}</option> }
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-500">{{ 'sales.cutOffs.' + row.key + 'Hint' | translate }}</p>
            </div>
          }
          @if (message()) { <p class="text-sm" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</p> }
          <div class="flex justify-end"><app-button [loading]="saving()" (clicked)="save()">{{ 'sales.cutOffs.save' | translate }}</app-button></div>
        </section>
      }
    </div>
  `,
})
export class SessionCutOffsComponent {
  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);

  readonly select = SELECT;
  readonly days = Array.from({ length: 31 }, (_, i) => i + 1);
  readonly rows = [
    { key: 'aprMar' as const, months: [1, 2, 3] },
    { key: 'janDec' as const, months: [10, 11, 12] },
  ];
  readonly value = signal<SessionCutOffs | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);

  constructor() {
    this.sales.cutOffs().subscribe({ next: (v) => this.value.set(v), error: (e: unknown) => this.show(messageForError(e, this.translate), true) });
  }

  day(key: 'aprMar' | 'janDec'): number {
    const v = this.value();
    return v ? (key === 'aprMar' ? v.aprMarDay : v.janDecDay) : 1;
  }

  month(key: 'aprMar' | 'janDec'): number {
    const v = this.value();
    return v ? (key === 'aprMar' ? v.aprMarMonth : v.janDecMonth) : 1;
  }

  set(key: 'aprMar' | 'janDec', part: 'day' | 'month', n: number): void {
    const field = `${key}${part === 'day' ? 'Day' : 'Month'}` as keyof SessionCutOffs;
    this.value.update((v) => (v ? { ...v, [field]: n } : v));
  }

  save(): void {
    const v = this.value();
    if (!v) {
      return;
    }
    this.saving.set(true);
    this.sales.changeCutOffs(v).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.value.set(saved);
        this.show(this.translate.instant('sales.cutOffs.saved'), false);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.show(messageForError(e, this.translate), true);
      },
    });
  }

  private show(text: string, error: boolean): void {
    this.message.set(text);
    this.isError.set(error);
  }
}
