import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicField } from '../../models/inventory-form.model';

@Component({
  selector: 'app-dynamic-fields-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-fields-card.component.html',
  styleUrl: './dynamic-fields-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFieldsCardComponent {
  @Input() fields: DynamicField[] = [];
  @Input() values: Record<string, string> = {};
  @Input() typeLabel = '';
  @Input() readOnly = false;
}
