import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryFormComponent } from '@org/inventory';

@Component({
  selector: 'app-admin-inventory-edit-page',
  standalone: true,
  imports: [InventoryFormComponent],
  template: `
    <div class="p-6">
      <app-inventory-form [editId]="propertyId" backLabel="Back to Inventory" (saved)="onSaved($event)" (cancelled)="onCancelled()" (back)="onCancelled()"/>
    </div>
  `,
})
export class AdminInventoryEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly propertyId = Number(this.route.snapshot.params['id']);

  onSaved(event: { id: number; isDraft: boolean }): void {
    this.router.navigate(['/admin/inventory/detail', event.id]);
  }

  onCancelled(): void {
    this.router.navigate(['/admin/inventory/list']);
  }
}
