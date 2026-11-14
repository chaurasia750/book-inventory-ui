import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LeadsDashboardComponent } from '@org/leads';

@Component({
  selector: 'app-admin-leads-page',
  standalone: true,
  imports: [LeadsDashboardComponent],
  template: `<app-leads-dashboard appPrefix="admin" (addLead)="onAddLead()" (viewList)="onViewList()"/>`,
})
export class AdminLeadsPageComponent {
  private readonly router = inject(Router);

  onViewList(): void {
    this.router.navigate(['/admin/leads']);
  }

  onAddLead(): void {
    this.router.navigate(['/admin/leads/add']);
  }
}
