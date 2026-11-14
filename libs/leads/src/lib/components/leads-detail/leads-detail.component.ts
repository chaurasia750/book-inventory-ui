import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { LeadsService } from '../../services/leads.service';
import { LeadDetail } from '../../models/lead-api.model';
import { LoadingSpinnerComponent } from '@org/ui';

@Component({
  selector: 'app-leads-detail',
  standalone: true,
  imports: [DecimalPipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      @if (loading()) {
        <app-loading-spinner/>
      } @else if (lead()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ lead()!.title }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ lead()!.contact.email }} | {{ lead()!.contact.mobile }}</p>
          </div>
          <span class="inline-block rounded-md border px-3 py-1 text-xs font-semibold" [style.color]="lead()!.status.colorCode" [style.border-color]="lead()!.status.colorCode">
            {{ lead()!.status.name }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-500">Expected Amount:</span> <span class="font-semibold">\u20B9{{ lead()!.expectedAmount | number }}</span></div>
          <div><span class="text-gray-500">Probability:</span> <span class="font-semibold">{{ lead()!.closingProbability }}%</span></div>
          <div><span class="text-gray-500">Priority:</span> <span class="font-semibold capitalize">{{ lead()!.priority }}</span></div>
          <div><span class="text-gray-500">Assigned To:</span> <span class="font-semibold">{{ lead()!.assignedUser?.userName || 'Unassigned' }}</span></div>
          <div class="col-span-2"><span class="text-gray-500">Description:</span> <span>{{ lead()!.description || 'No description' }}</span></div>
        </div>
      } @else {
        <div class="text-center py-12 text-gray-400">Lead not found</div>
      }
    </div>
  `,
})
export class LeadsDetailComponent implements OnInit {
  readonly leadId = input.required<number>();
  readonly appPrefix = input('');

  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);

  lead = signal<LeadDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.leadsService.getLeadById(this.leadId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.lead.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
