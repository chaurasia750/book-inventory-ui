import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LeadDetail } from '../../models/lead-api.model';

@Component({
  selector: 'app-leads-followup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Follow-up for {{ lead()?.title }}</h3>
      <p class="text-sm text-gray-500">Follow-up functionality coming soon.</p>
      <button (click)="closed.emit()" class="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
    </div>
  `,
})
export class LeadsFollowupComponent {
  readonly lead = input<LeadDetail | null>(null);
  readonly autoOpen = input(false);
  readonly closed = output<void>();
}
