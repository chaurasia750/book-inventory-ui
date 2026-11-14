import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanySummary } from '@org/shared-models';

/**
 * The Super Admin's company picker (company spec R13): "No company", or the company they entered. Choosing a company
 * enters it, choosing "No company" leaves it; the server keeps the choice on the session and refreshes the access cookie.
 * Only active companies are offered (an inactive one would be refused with 409). While the list loads the select is
 * disabled; if it cannot be read the select stays on its previous value and the catalogue message is shown.
 */
@Component({
  selector: 'app-company-picker',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      <label for="company-picker" class="hidden text-xs text-gray-500 sm:block">{{ 'company.picker.label' | translate }}</label>
      <select
        id="company-picker"
        class="h-9 max-w-[12rem] rounded-xl border border-gray-200 bg-gray-50 px-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        [disabled]="loading() || working()"
        (change)="choose($any($event.target).value)"
      >
        <option value="" [selected]="selectedId() === ''">{{ 'company.picker.none' | translate }}</option>
        @for (c of companies(); track c.id) {
          <option [value]="c.id" [selected]="selectedId() === c.id">{{ c.name }}</option>
        }
      </select>
      @if (error()) {
        <span class="text-xs text-red-600" role="alert">{{ error() }}</span>
      }
    </div>
  `,
})
export class CompanyPickerComponent {
  private readonly service = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly companies = signal<CompanySummary[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal('');

  constructor() {
    this.service.list({ status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: 200 }).subscribe({
      next: (result) => {
        this.companies.set(result.items);
        this.loadCurrent();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(error, this.translate));
      },
    });
  }

  choose(id: string): void {
    this.working.set(true);
    this.error.set('');
    const call = id === '' ? this.service.leave() : this.service.enter(id);
    call.subscribe({
      next: (response) => {
        this.working.set(false);
        this.selectedId.set(response.company?.id ?? '');
      },
      error: (error: unknown) => {
        this.working.set(false);
        this.error.set(messageForError(error, this.translate));
        this.loadCurrent();
      },
    });
  }

  private loadCurrent(): void {
    this.service.current().subscribe({
      next: (company) => {
        this.loading.set(false);
        this.selectedId.set(company.id);
      },
      error: () => {
        this.loading.set(false);
        this.selectedId.set('');
      },
    });
  }
}
