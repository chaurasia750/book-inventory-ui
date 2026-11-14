import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeadsService } from '../../services/leads.service';
import { KpiCard, StatusBreakdown, MonthlyTrend } from '../../models/lead.model';
import { LeadHeaderComponent } from '../lead-header/lead-header.component';
import { KpiCardsComponent } from '../kpi-cards/kpi-cards.component';

@Component({
  selector: 'app-leads-dashboard',
  standalone: true,
  imports: [LeadHeaderComponent, KpiCardsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <app-lead-header (addLead)="addLead.emit()"/>

      <div class="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div class="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#339AF0] via-[#CC5DE8] to-[#FF6B6B] py-1">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white"></div>
            <div class="absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-white"></div>
          </div>
        </div>

        <div class="space-y-6 px-6 pb-6">
          <app-kpi-cards [cards]="kpiCards"/>

          <div class="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
              <h3 class="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Lead Status</h3>
              <div class="space-y-3">
                @for (item of statusBreakdown; track item.label) {
                  <div>
                    <div class="mb-1 flex items-center justify-between text-sm">
                      <span class="flex items-center gap-2">
                        <span class="h-2.5 w-2.5 rounded-full" [style.background]="item.color"></span>
                        <span class="font-medium text-[#111111]">{{ item.label }}</span>
                      </span>
                      <span class="font-semibold text-gray-500">{{ item.value }}</span>
                    </div>
                    <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div class="h-full rounded-full transition-all duration-500" [style.width.%]="(item.value / totalStatusValue) * 100" [style.background]="item.color"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 class="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Monthly Trends</h3>
              <div class="flex items-end gap-2" style="height: 180px;">
                @for (item of monthlyTrends; track item.month) {
                  <div class="flex flex-1 flex-col items-center gap-1" style="height: 100%;">
                    <div class="flex w-full flex-col-reverse" style="height: 160px;">
                      <div class="w-full rounded-t transition-all duration-500" [style.height.%]="(item.conversions / maxTrendValue) * 100" style="background: #51CF66;" title="Conversions: {{ item.conversions }}"></div>
                      <div class="w-full rounded-t transition-all duration-500" [style.height.%]="((item.leads - item.conversions) / maxTrendValue) * 100" style="background: #339AF0;" title="Leads: {{ item.leads }}"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-400">{{ item.month }}</span>
                  </div>
                }
              </div>
              <div class="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm" style="background: #339AF0;"></span> Leads</span>
                <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm" style="background: #51CF66;"></span> Conversions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LeadsDashboardComponent implements OnInit {
  readonly appPrefix = input('');
  readonly addLead = output<void>();
  readonly viewList = output<void>();

  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);

  kpiCards: KpiCard[] = [];
  statusBreakdown: StatusBreakdown[] = [];
  monthlyTrends: MonthlyTrend[] = [];

  ngOnInit(): void {
    this.leadsService.getKpiCards().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.kpiCards = d);
    this.leadsService.getLeadStatuses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.statusBreakdown = d);
    this.leadsService.getMonthlyTrends().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.monthlyTrends = d);
  }

  get maxTrendValue(): number {
    return Math.max(...this.monthlyTrends.flatMap(t => [t.leads, t.conversions]), 1);
  }

  get totalStatusValue(): number {
    return this.statusBreakdown.reduce((sum, s) => sum + s.value, 0);
  }
}
