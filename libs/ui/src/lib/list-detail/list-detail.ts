import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The list-and-detail layout (spec platform U10): the full-width list, and once a record is chosen the list narrows to one
 * side and the record opens beside it. On a phone the record takes the whole screen. The page decides when a record is open
 * (`hasDetail`, from the child route id in the URL) and shows the Close button inside the detail, so Back, refresh and a
 * shared link all work.
 *
 * Content: `<div list>` for the list, `<div detail>` for the open record.
 */
@Component({
  selector: 'app-list-detail',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-start gap-4">
      <section
        class="min-w-0 rounded-xl border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800"
        [class]="hasDetail() ? 'hidden w-full max-w-[340px] flex-[1_1_300px] md:block' : 'w-full flex-1'"
        [attr.aria-label]="listLabel()"
      >
        <ng-content select="[list]" />
      </section>
      @if (hasDetail()) {
        <section class="min-w-0 flex-[999_1_560px]" [attr.aria-label]="detailLabel()">
          <ng-content select="[detail]" />
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDetailComponent {
  /** True while a record is open. */
  readonly hasDetail = input(false);
  readonly listLabel = input('List');
  readonly detailLabel = input('Details');
}
