import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LeadsService } from '../../services/leads.service';
import { Lead } from '../../models/lead.model';
import { getLeadStatusBadge } from '../../models/lead-constants';
import { initials } from '@org/shared-utils';

@Component({
  selector: 'app-recent-leads',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-4">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Leads</h3>
      </div>
      <div class="divide-y divide-gray-50">
        @for (lead of leads; track lead.id) {
          <div class="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors"
               (click)="viewLead.emit(lead.id)">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#66B42A]/20 text-[11px] font-bold text-[#111111]">
              {{ getInitials(lead.name) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">{{ lead.name }}</p>
              <p class="text-xs text-gray-400">{{ lead.email }}</p>
            </div>
            <span class="shrink-0 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase"
                  [class]="getStatusClass(lead.status)">
              {{ lead.status }}
            </span>
          </div>
        }
        @if (leads.length === 0) {
          <div class="px-6 py-8 text-center text-sm text-gray-400">No recent leads</div>
        }
      </div>
    </div>
  `,
})
export class RecentLeadsComponent implements OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly viewLead = output<number>();

  leads: Lead[] = [];

  ngOnInit(): void {
    this.leadsService.getRecentLeads().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (data) => this.leads = data });
  }

  getInitials = initials;

  getStatusClass(status: string): string {
    return getLeadStatusBadge(status);
  }
}
