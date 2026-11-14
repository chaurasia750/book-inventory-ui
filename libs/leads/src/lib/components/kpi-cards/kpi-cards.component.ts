import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KpiCard } from '../../models/lead.model';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      @for (card of cards(); track card.label) {
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl" [style.background]="card.color + '20'">
              <svg class="h-5 w-5" [style.color]="card.color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                @switch (card.icon) {
                  @case ('users') { <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> }
                  @case ('fire') { <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2 2-4 2z"/> }
                  @case ('phone') { <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/> }
                  @case ('check') { <polyline points="20 6 9 17 4 12"/> }
                  @case ('trending-up') { <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/> }
                  @default { <circle cx="12" cy="12" r="10"/> }
                }
              </svg>
            </div>
            <span class="text-xs font-medium" [style.color]="card.growth >= 0 ? '#10B981' : '#EF4444'">
              {{ card.growth >= 0 ? '+' : '' }}{{ card.growth }}%
            </span>
          </div>
          <div class="mt-3">
            <p class="text-2xl font-bold text-gray-900">{{ card.value | number }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ card.label }}</p>
          </div>
        </div>
      }
    </div>
  `,
  imports: [DecimalPipe],
})
export class KpiCardsComponent {
  readonly cards = input<KpiCard[]>([]);
}
