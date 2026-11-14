import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeadsAddLeadComponent } from '@org/leads';

@Component({
  selector: 'app-admin-leads-edit-page',
  standalone: true,
  imports: [LeadsAddLeadComponent],
  template: `<app-leads-add-lead appPrefix="admin" [leadId]="leadId"/>`,
})
export class AdminLeadsEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly leadId = Number(this.route.snapshot.params['id']);
}
