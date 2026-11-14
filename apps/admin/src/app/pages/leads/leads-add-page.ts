import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeadsAddLeadComponent } from '@org/leads';

@Component({
  selector: 'app-admin-leads-add-page',
  standalone: true,
  imports: [LeadsAddLeadComponent],
  template: `<app-leads-add-lead appPrefix="admin" [initialPropertyId]="propertyId"/>`,
})
export class AdminLeadsAddPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly propertyId = Number(this.route.snapshot.queryParams['propertyId']) || 0;
}
