import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryDetailsComponent } from '@org/inventory';

@Component({
  selector: 'app-admin-inventory-detail-page',
  standalone: true,
  imports: [InventoryDetailsComponent],
  template: `
    <div class="p-6">
      <app-inventory-details
        [propertyId]="propertyId"
        [showActions]="true"
        backRoute="/admin/inventory/list"
        (back)="onBack()"
        (edit)="onEdit($event)"
      />
    </div>
  `,
})
export class AdminInventoryDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly propertyId = Number(this.route.snapshot.params['id']);

  onBack(): void {
    this.router.navigate(['/admin/inventory/list']);
  }

  onEdit(id: number): void {
    this.router.navigate(['/admin/inventory/edit', id]);
  }
}
