import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PlanningService, SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ClassBookListView, SchoolBookLists, SchoolClassItem } from '@org/shared-models';
import { ButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { ClassListEditorComponent } from './class-list-editor';
import { CopyListsDialogComponent } from './copy-lists-dialog';

/**
 * Planning spec R2-R7 (section 6): the Book lists tab of a school's profile. Choose the session (the school's current one, the
 * one before or after), see every class with its book count and student estimate and what changed since last session, open a
 * class to edit its list, copy last session's lists or another school's. Staff read only.
 */
@Component({
  selector: 'app-book-lists-tab',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, SkeletonLoaderComponent, ClassListEditorComponent, CopyListsDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <p class="m-0 text-xs text-gray-500">{{ 'planning.subtitle' | translate }}</p>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="flex items-center gap-2 text-sm">{{ 'planning.session' | translate }}
          <select [value]="session()" (change)="session.set($any($event.target).value); load()" class="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm">
            @for (s of sessions(); track s) { <option [value]="s" [selected]="s === session()">{{ s }}</option> }
          </select>
        </label>
        @if (canEdit()) {
          <div class="flex gap-2">
            <app-button size="sm" variant="secondary" (clicked)="copyOpen.set('last')">{{ 'planning.copyLast' | translate }}</app-button>
            <app-button size="sm" variant="secondary" (clicked)="copyOpen.set('other')">{{ 'planning.copyOther' | translate }}</app-button>
          </div>
        }
      </div>
      @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{{ notice() }}</p> }
      @if (loading()) {
        <app-skeleton-loader width="100%" />
      } @else if (lists(); as data) {
        <p class="m-0 text-xs text-gray-400">{{ 'planning.diffHint' | translate: { session: data.previousSession } }}</p>
        <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'planning.class' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'planning.books' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'planning.students' | translate }}</th>
                <th class="px-3 py-2 font-semibold"></th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @for (c of data.classes; track c.className) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                  <td class="px-3 py-2 font-medium text-primary-fg">{{ c.className }}</td>
                  <td class="px-3 py-2 text-right">{{ c.hasList ? c.lines.length : '-' }}</td>
                  <td class="px-3 py-2 text-right">{{ c.studentEstimate ?? '-' }}</td>
                  <td class="px-3 py-2 text-gray-500">
                    @if (!c.hasList) { {{ 'planning.noList' | translate }} }
                    @else if (changes(c); as n) { <span class="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800">{{ n }}</span> }
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button type="button" (click)="editing.set(c)" class="text-primary-fg hover:underline">{{ (c.hasList || !canEdit() ? 'planning.open' : 'planning.start') | translate }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (editing(); as c) {
          <app-class-list-editor [schoolId]="schoolId()" [session]="data.session" [previousSession]="data.previousSession" [list]="c" [classes]="classNames()" [canEdit]="canEdit()"
            (closed)="editing.set(null)" (saved)="editing.set(null); load()" />
        }
        <app-copy-lists-dialog [open]="copyOpen() !== null" [mode]="copyOpen() ?? 'last'" [schoolId]="schoolId()" [session]="data.session" [previousSession]="data.previousSession"
          (closed)="copyOpen.set(null)" (copied)="copied($event)" />
      }
    </div>
  `,
})
export class BookListsTabComponent {
  readonly schoolId = input.required<string>();
  readonly classes = input<SchoolClassItem[]>([]);
  readonly canEdit = input(false);

  private readonly planning = inject(PlanningService);
  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);

  readonly session = signal('');
  readonly sessions = signal<string[]>([]);
  readonly lists = signal<SchoolBookLists | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly editing = signal<ClassBookListView | null>(null);
  readonly copyOpen = signal<'last' | 'other' | null>(null);

  constructor() {
    effect(() => {
      const id = this.schoolId();
      untracked(() => this.start(id));
    });
  }

  classNames(): string[] {
    return this.classes().map((c) => c.name);
  }

  /** R7: how many books of the class were added or changed since the previous session, plus the removed ones. */
  changes(c: ClassBookListView): number {
    return c.lines.filter((l) => l.change !== 'SAME').length + c.removed.length;
  }

  private start(schoolId: string): void {
    this.sales.sessionChoice(schoolId, new Date().toISOString().slice(0, 10)).subscribe({
      next: (c) => {
        this.sessions.set([c.previous, c.session, c.next]);
        this.session.set(c.session);
        this.load();
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.planning.bookLists(this.schoolId(), this.session()).subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  copied(result: { copied: string[]; skipped: string[] }): void {
    this.copyOpen.set(null);
    const none = this.translate.instant('planning.none');
    this.notice.set(this.translate.instant('planning.copied', { copied: result.copied.join(', ') || none, skipped: result.skipped.join(', ') || none }));
    this.load();
  }
}
