import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses()">
      @if (title()) {
        <div class="px-6 py-5">
          <h3 class="text-base font-semibold text-gray-900">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="mt-1 text-sm text-gray-500">{{ subtitle() }}</p>
          }
        </div>
        <div class="border-t border-gray-100"></div>
      }
      <div [class]="contentClass()">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly padding = input(true);
  readonly variant = input<'default' | 'borderless'>('default');

  readonly cardClasses = computed(() => {
    const base = this.variant() === 'borderless'
      ? 'bg-white'
      : 'rounded-2xl border border-gray-100 bg-white shadow-sm';
    return base;
  });

  readonly contentClass = computed(() => this.padding() ? 'p-6' : 'p-0');
}
