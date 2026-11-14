import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryListComponent } from '@org/inventory';

@Component({
  selector: 'app-admin-inventory-list-page',
  standalone: true,
  imports: [InventoryListComponent],
  template: `
    <div class="p-6">
      <h1 class="mb-4 text-2xl font-bold text-gray-900">Inventory</h1>
      <app-inventory-list
        [showAddButton]="true"
        [showEditButton]="true"
        (addInventory)="onAddInventory()"
        (viewDetails)="onViewDetails($event)"
        (editInventory)="onEditInventory($event)"
        (addLeadForProperty)="onAddLeadForProperty($event)"
      />
    </div>
  `,
})
export class AdminInventoryListPageComponent {
  private readonly router = inject(Router);

  onAddInventory(): void {
    this.router.navigate(['/admin/inventory/add']);
  }

  onViewDetails(id: number): void {
    this.router.navigate(['/admin/inventory/detail', id]);
  }

  onEditInventory(id: number): void {
    this.router.navigate(['/admin/inventory/edit', id]);
  }

  onAddLeadForProperty(propertyId: number): void {
    this.router.navigate(['/admin/leads/add'], { queryParams: { propertyId } });
  }
}
