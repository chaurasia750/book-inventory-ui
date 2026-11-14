import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeadsClosingComponent } from '@org/leads';

@Component({
  selector: 'app-admin-leads-closing-page',
  standalone: true,
  imports: [LeadsClosingComponent],
  template: `<app-leads-closing appPrefix="admin" [leadId]="leadId"/>`,
})
export class AdminLeadsClosingPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly leadId = Number(this.route.snapshot.params['id']);
}
