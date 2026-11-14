import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** The X that closes the record open beside a list and shows the full list again (spec platform U10). */
@Component({
  selector: 'app-close-button',
  standalone: true,
  template: `
    <button
      type="button"
      (click)="clicked.emit()"
      [attr.aria-label]="label()"
      [title]="label()"
      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-charcoal-900 transition-colors hover:border-gold-500 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-gray-200"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseButtonComponent {
  readonly label = input('Close');
  readonly clicked = output<void>();
}
