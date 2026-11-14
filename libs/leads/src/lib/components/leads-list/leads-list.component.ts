import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../../services/leads.service';
import { UsersService } from '../../services/users.service';
import { Lead } from '../../models/lead.model';
import { LeadLookupItem } from '../../models/lead-api.model';
import { User } from '../../models/user.model';
import { PaginationComponent, ConfirmationDialogComponent, ButtonComponent, BreadcrumbComponent, BreadcrumbItem } from '@org/ui';
import { LeadsFiltersComponent, LeadFilters } from '../leads-filters/leads-filters.component';
import { LeadsTableComponent } from '../leads-table/leads-table.component';
import { SharedUserSelectComponent } from '../shared-user-select/shared-user-select.component';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [FormsModule, BreadcrumbComponent, PaginationComponent, LeadsFiltersComponent, LeadsTableComponent, SharedUserSelectComponent, ConfirmationDialogComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex items-center justify-between gap-4">
      <app-breadcrumb [pageTitle]="moduleName" [items]="breadcrumbItems"/>
      <app-button variant="yellow" size="sm" (click)="addLead.emit()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ addButtonText() }}
      </app-button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <app-leads-filters (filterChange)="onFilterChange($event)"/>
      @if (showAssignUser() && showBulkBar) {
        <div class="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50/80 px-4 py-2.5">
          <span class="text-sm font-medium text-amber-800 whitespace-nowrap">{{ selectedIds.size }} {{ moduleItemName }}(s) selected</span>
          <app-shared-user-select [(ngModel)]="selectedUserId" placeholderText="Assign to user..."/>
          <div class="flex items-center gap-2">
            <app-button variant="yellow" size="sm" (click)="openConfirmModal()" [disabled]="!selectedUserId || bulkAssigning">Assign</app-button>
            <app-button variant="outline" size="sm" (click)="clearSelection()">Cancel</app-button>
          </div>
        </div>
      }
      <app-leads-table [showAssignUser]="showAssignUser()" [leads]="leads" [selectedIds]="selectedIds" [allSelected]="allSelected" (toggleAll)="onToggleAll()" (selectionChange)="onSelectionChange($event)" (editLead)="onEditLead($event)" (followUp)="onFollowUp($event)" (closing)="onClosing($event)"/>
      <app-pagination [page]="pageIndex" [pageSize]="pageSize" [total]="totalCount" (pageChange)="onPageChange($event)"/>
    </div>

    <app-confirmation-dialog [open]="showConfirmModal" title="Confirm Bulk Assignment" (confirm)="confirmAssign()" (cancelled)="cancelAssign()">
      <p class="mt-1 text-sm text-gray-500">
        Assign <strong>{{ selectedLeads.length }}</strong> {{ moduleItemName }}(s) to
        <strong>{{ pendingUser?.fullName || 'selected user' }}</strong>
      </p>
    </app-confirmation-dialog>
  `,
})
export class LeadsListComponent implements OnInit {
  readonly appPrefix = input('');
  readonly addButtonText = input('Add Lead');
  readonly showAssignUser = input(true);
  readonly addLead = output<void>();
  readonly viewLead = output<number>();
  readonly closing = output<number>();

  get moduleName(): string { return this.appPrefix() === 'member' ? 'Customers' : 'Leads'; }
  get moduleItemName(): string { return this.appPrefix() === 'member' ? 'customer' : 'lead'; }
  get breadcrumbItems(): BreadcrumbItem[] {
    return [{ label: 'CRM' }, { label: 'All ' + this.moduleName }];
  }

  private readonly leadsService = inject(LeadsService);
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  selectedIds = new Set<number>();
  allSelected = false;
  bulkAssigning = false;
  selectedUserId: number | null = null;
  showConfirmModal = false;
  pendingUserId: number | null = null;
  get showBulkBar(): boolean { return this.selectedIds.size > 0; }
  get selectedLeads(): Lead[] { return this.leads.filter(l => this.selectedIds.has(l.id)); }
  get pendingUser(): User | undefined { return this.users.find(u => u.id === this.pendingUserId); }

  leads: Lead[] = [];
  users: User[] = [];
  statuses: LeadLookupItem[] = [];

  pageIndex = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  currentFilters: LeadFilters = { page: 1, pageSize: 20, search: '', statusId: '', sourceId: '', assignedUserId: '', dateFrom: '', dateTo: '' };

  ngOnInit(): void {
    this.loadLeads();
    this.usersService.getUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (data) => this.users = data });
    this.leadsService.getLeadStatusLookup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (data) => this.statuses = data });
  }

  private loadLeads(): void {
    const params = {
      page: this.currentFilters.page,
      pageSize: this.currentFilters.pageSize,
      search: this.currentFilters.search || undefined,
      statusId: this.currentFilters.statusId ? +this.currentFilters.statusId : undefined,
      sourceId: this.currentFilters.sourceId ? +this.currentFilters.sourceId : undefined,
      assignedUserId: this.currentFilters.assignedUserId ? +this.currentFilters.assignedUserId : undefined,
      fromDate: this.currentFilters.dateFrom || undefined,
      toDate: this.currentFilters.dateTo || undefined,
    };
    this.leadsService.getLeads(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.leads = res.items; this.pageIndex = res.page; this.pageSize = res.pageSize; this.totalCount = res.totalCount; this.totalPages = res.totalPages; },
    });
  }

  onFilterChange(filters: LeadFilters): void { this.currentFilters = filters; this.loadLeads(); }
  onPageChange(page: number): void { this.currentFilters = { ...this.currentFilters, page }; this.loadLeads(); }
  onEditLead(lead: Lead): void { this.viewLead.emit(lead.id); }
  onFollowUp(_lead: Lead): void { /* TODO: open followup panel */ }
  onClosing(lead: Lead): void { this.closing.emit(lead.id); }

  onSelectionChange(event: { leadId: number; checked: boolean }): void {
    if (event.checked) { this.selectedIds.add(event.leadId); } else { this.selectedIds.delete(event.leadId); }
    this.selectedIds = new Set(this.selectedIds);
    this.allSelected = this.leads.length > 0 && this.leads.every(l => this.selectedIds.has(l.id));
  }

  clearSelection(): void { this.selectedIds = new Set(); this.allSelected = false; this.selectedUserId = null; }

  onToggleAll(): void {
    if (this.allSelected) { this.selectedIds = new Set(); this.allSelected = false; }
    else { this.selectedIds = new Set(this.leads.map(l => l.id)); this.allSelected = true; }
  }

  openConfirmModal(): void {
    if (!this.selectedUserId || this.selectedIds.size === 0) return;
    this.pendingUserId = this.selectedUserId;
    this.showConfirmModal = true;
  }

  cancelAssign(): void { this.showConfirmModal = false; this.pendingUserId = null; }

  confirmAssign(): void {
    if (!this.pendingUserId) return;
    this.showConfirmModal = false;
    this.bulkAssigning = true;
    this.leadsService.bulkAssignLead({ leadIds: Array.from(this.selectedIds), assignedUserId: this.pendingUserId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.clearSelection(); this.loadLeads(); this.bulkAssigning = false; }, error: () => { this.bulkAssigning = false; } });
  }
}
