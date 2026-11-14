import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryFormComponent } from '@org/inventory';

@Component({
  selector: 'app-admin-inventory-add-page',
  standalone: true,
  imports: [InventoryFormComponent],
  template: `
    <div class="p-6">
      <app-inventory-form backLabel="Back to Inventory" (saved)="onSaved($event)" (cancelled)="onCancelled()" (back)="onCancelled()"/>
    </div>
  `,
})
export class AdminInventoryAddPageComponent {
  private readonly router = inject(Router);

  onSaved(event: { id: number; isDraft: boolean }): void {
    this.router.navigate(['/admin/inventory/detail', event.id]);
  }

  onCancelled(): void {
    this.router.navigate(['/admin/inventory/list']);
  }
}
