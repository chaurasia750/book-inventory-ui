import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div [class]="spinnerClass()"></div>
        @if (text()) {
          <p class="text-sm text-gray-500">{{ text() }}</p>
        }
      </div>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly text = input('Loading...');

  readonly spinnerClass = computed(() => {
    const sizes: Record<string, string> = {
      sm: 'h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent',
      md: 'h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent',
      lg: 'h-12 w-12 animate-spin rounded-full border-[5px] border-brand-500 border-t-transparent',
    };
    return sizes[this.size()] ?? sizes['md'];
  });
}
