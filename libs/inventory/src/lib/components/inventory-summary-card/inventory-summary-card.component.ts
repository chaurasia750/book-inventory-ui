import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DynamicField, UploadedFile } from '../../models/inventory-form.model';

@Component({
  selector: 'app-inventory-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-summary-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySummaryCardComponent {
  @Input() propertyImage: string | null = null;
  @Input() propertyName = '';
  @Input() description = '';
  @Input() locationUrl = '';
  @Input() typeLabel = '';
  @Input() uploadedFiles: UploadedFile[] = [];
  @Input() fieldDefinitions: DynamicField[] = [];
  @Input() dynamicValues: Record<string, string> = {};

  get locationValue(): string {
    return this.dynamicValues['Location'] || '';
  }

  get descriptionValue(): string {
    return this.description || this.dynamicValues['Description'] || '';
  }

  get visibleFields(): DynamicField[] {
    return this.fieldDefinitions.filter(
      f => f.key !== 'Location' && f.key !== 'Description' && this.dynamicValues[f.key]?.trim(),
    );
  }

  formatValue(field: DynamicField, value: string): string {
    if (field.type === 'number' && value) {
      const num = +value;
      if (!isNaN(num)) return num.toLocaleString('en-IN');
    }
    return value;
  }
}
