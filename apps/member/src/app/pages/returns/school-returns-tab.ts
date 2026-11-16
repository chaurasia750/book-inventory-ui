import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '@org/auth';
import { ReturnService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CreditNoteSummary, PagedList, Refund } from '@org/shared-models';
import { ButtonComponent, SkeletonLoaderComponent } from '@org/ui';

const SHOWN = 20;

/**
 * The Returns tab of a school's profile (sales spec R61, R69, platform U16): the school's credit notes (the books it gave back) and,
 * for the Owner only (R67), its refunds, newest first. A row opens the document beside its own list; the Owner and Staff see the
 * credit notes, only the Owner the refunds.
 */
@Component({
  selector: 'app-school-returns-tab',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      }
      <section>
        <h3 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'returns.title' | translate }}</h3>
        <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'returns.columns.number' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'returns.columns.date' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'returns.fields.reason' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.totals.grandTotal' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @if (loading()) { <tr><td colspan="4" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr> }
              @else {
                @for (n of notes(); track n.id) {
                  <tr>
                    <td class="px-3 py-2"><a [routerLink]="['/returns', n.id]" class="font-mono font-medium text-brand-700 hover:underline">{{ n.number }}</a></td>
                    <td class="whitespace-nowrap px-3 py-2">{{ n.noteDate | date: 'dd MMM yy' }}</td>
                    <td class="px-3 py-2">{{ 'returns.reason.' + n.reason | translate }}</td>
                    <td class="px-3 py-2 text-right font-mono" [class.line-through]="n.status === 'CANCELLED'">{{ n.grandTotal | number: '1.2-2' }}</td>
                  </tr>
                } @empty { <tr><td colspan="4" class="py-6 text-center text-gray-400">{{ 'returns.empty' | translate }}</td></tr> }
              }
            </tbody>
          </table>
        </div>
      </section>

      @if (isOwner) {
        <section>
          <h3 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'refunds.title' | translate }}</h3>
          <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
            <table class="w-full text-left text-xs">
              <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
                <tr>
                  <th class="px-3 py-2 font-semibold">{{ 'returns.columns.number' | translate }}</th>
                  <th class="px-3 py-2 font-semibold">{{ 'returns.columns.date' | translate }}</th>
                  <th class="px-3 py-2 font-semibold">{{ 'refunds.fields.mode' | translate }}</th>
                  <th class="px-3 py-2 text-right font-semibold">{{ 'refunds.fields.amount' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                @if (loading()) { <tr><td colspan="4" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr> }
                @else {
                  @for (r of refunds(); track r.id) {
                    <tr>
                      <td class="px-3 py-2"><a [routerLink]="['/refunds', r.id]" class="font-mono font-medium text-brand-700 hover:underline">{{ r.number }}</a></td>
                      <td class="whitespace-nowrap px-3 py-2">{{ r.refundDate | date: 'dd MMM yy' }}</td>
                      <td class="px-3 py-2">{{ 'refunds.mode.' + r.mode | translate }}</td>
                      <td class="px-3 py-2 text-right font-mono" [class.line-through]="r.status === 'CANCELLED'">{{ r.amount | number: '1.2-2' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="4" class="py-6 text-center text-gray-400">{{ 'refunds.empty' | translate }}</td></tr> }
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class SchoolReturnsTabComponent {
  readonly schoolId = input.required<string>();

  private readonly service = inject(ReturnService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** R67: the refunds are the Owner's. */
  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  readonly notes = signal<CreditNoteSummary[]>([]);
  readonly refunds = signal<Refund[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    queueMicrotask(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service
      .creditNotes({ schoolId: this.schoolId(), orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: SHOWN })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.notes.set(page.items);
          this.loadRefunds();
        },
        error: (e: unknown) => this.fail(e),
      });
  }

  private loadRefunds(): void {
    // One typed stream: the Owner loads the refunds, everyone else an empty one (R67).
    const refunds$: Observable<PagedList<Refund> | null> = this.isOwner
      ? this.service.refunds({ schoolId: this.schoolId(), orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: SHOWN })
      : of(null);
    refunds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.loading.set(false);
          this.refunds.set(page?.items ?? []);
        },
        error: (e: unknown) => this.fail(e),
      });
  }

  private fail(e: unknown): void {
    this.loading.set(false);
    this.error.set(messageForError(e, this.translate));
  }
}
