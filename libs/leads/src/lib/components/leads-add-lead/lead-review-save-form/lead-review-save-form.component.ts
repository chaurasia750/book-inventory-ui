import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { LeadLookupItem } from '../../../models/lead-api.model';
import { User } from '../../../models/user.model';
import { Priority } from '../leads-add-lead.component';

@Component({
  selector: 'app-lead-review-save-form',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs text-muted-fg mb-1">Name</p>
          <p class="text-sm font-medium text-primary-fg">{{ form().get('title')?.value }} {{ form().get('firstName')?.value }} {{ form().get('lastName')?.value }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Email</p>
          <p class="text-sm font-medium text-primary-fg">{{ form().get('email')?.value }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Lead Source</p>
          <p class="text-sm font-medium text-primary-fg">{{ getSourceName(form().get('leadSource')?.value) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Lead Status</p>
          <p class="text-sm font-medium text-primary-fg">{{ getStatusName(form().get('leadStatus')?.value) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Expected Amount</p>
          <p class="text-sm font-medium text-primary-fg">\u20B9{{ (form().get('expectedAmount')?.value || 0) | number }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Probability</p>
          <p class="text-sm font-medium text-primary-fg">{{ form().get('probabilityPercentage')?.value }}%</p>
        </div>
        <div>
          <p class="text-xs text-muted-fg mb-1">Priority</p>
          <p class="text-sm font-medium text-primary-fg">{{ form().get('priority')?.value }}</p>
        </div>
        @if (showAssignUser()) {
          <div>
            <p class="text-xs text-muted-fg mb-1">Assigned To</p>
            <p class="text-sm font-medium text-primary-fg">{{ getUserName(form().get('assignedUser')?.value) }}</p>
          </div>
        }
      </div>
      @if (form().get('notes')?.value) {
        <div class="border-t border-default pt-4">
          <p class="text-xs text-muted-fg mb-1">Notes</p>
          <p class="text-sm text-secondary-fg">{{ form().get('notes')?.value }}</p>
        </div>
      }
    </div>
  `,
})
export class LeadReviewSaveFormComponent {
  readonly form = input.required<FormGroup>();
  readonly priorities = input<Priority[]>([]);
  readonly users = input<User[]>([]);
  readonly leadSources = input<LeadLookupItem[]>([]);
  readonly leadStatuses = input<LeadLookupItem[]>([]);
  readonly showAssignUser = input(true);

  getSourceName(id: number): string { return this.leadSources().find(s => s.id === id)?.name || '-'; }
  getStatusName(id: number): string { return this.leadStatuses().find(s => s.id === id)?.name || '-'; }
  getUserName(id: number): string { return this.users().find(u => u.id === id)?.fullName || '-'; }
}
