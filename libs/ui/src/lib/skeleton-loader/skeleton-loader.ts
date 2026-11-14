import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonType = 'text' | 'circle' | 'rect';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  templateUrl: './skeleton-loader.html',
  styleUrl: './skeleton-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  type = input<SkeletonType>('text');
  width = input('100%');
  height = input<string | undefined>(undefined);

  resolvedHeight = computed(() => {
    if (this.height()) {
      return this.height();
    }
    switch (this.type()) {
      case 'circle':
        return this.width();
      case 'rect':
        return '8rem';
      default:
        return '1rem';
    }
  });
}
