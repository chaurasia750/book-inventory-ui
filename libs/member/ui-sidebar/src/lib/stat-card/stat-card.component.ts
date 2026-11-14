import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center gap-3">
        @if (icon) {
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" [ngClass]="iconBgClass">
            <span class="text-lg" [ngClass]="iconClass">{{ icon }}</span>
          </div>
        }
        <div class="min-w-0">
          <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider truncate">{{ label }}</p>
          <p class="mt-1 text-xl font-bold truncate" [ngClass]="valueClass">
            {{ value | currency:'INR':'symbol':'1.0-0' }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number = 0;
  @Input() icon = '';
  @Input() color: 'default' | 'green' | 'amber' | 'red' | 'saffron' = 'default';

  get valueClass(): string {
    const map: Record<string, string> = {
      default: 'text-gray-900',
      green: 'text-green-600',
      amber: 'text-amber-600',
      red: 'text-red-500',
      saffron: 'text-saffron-600',
    };
    return map[this.color] ?? map['default'];
  }

  get iconBgClass(): string {
    const map: Record<string, string> = {
      default: 'bg-gray-100',
      green: 'bg-green-50',
      amber: 'bg-amber-50',
      red: 'bg-red-50',
      saffron: 'bg-saffron-50',
    };
    return map[this.color] ?? map['default'];
  }

  get iconClass(): string {
    const map: Record<string, string> = {
      default: 'text-gray-600',
      green: 'text-green-600',
      amber: 'text-amber-600',
      red: 'text-red-500',
      saffron: 'text-saffron-600',
    };
    return map[this.color] ?? map['default'];
  }
}
