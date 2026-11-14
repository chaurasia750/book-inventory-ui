import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-leads-closing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Lead Closing</h3>
      <p class="text-sm text-gray-500">Closing workflow for lead #{{ leadId() }}.</p>
    </div>
  `,
})
export class LeadsClosingComponent {
  readonly leadId = input.required<number>();
  readonly appPrefix = input('');
}
