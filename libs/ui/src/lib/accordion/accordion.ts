import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

export interface AccordionItem {
  title: string;
  content: string;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  templateUrl: './accordion.html',
  styleUrl: './accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionComponent {
  items = input<AccordionItem[]>([]);
  multiple = input(false);

  private readonly openIndices = signal<Set<number>>(new Set());

  isOpen(index: number): boolean {
    return this.openIndices().has(index);
  }

  toggle(index: number): void {
    const current = new Set(this.openIndices());
    if (current.has(index)) {
      current.delete(index);
      this.openIndices.set(current);
      return;
    }

    if (this.multiple()) {
      current.add(index);
      this.openIndices.set(current);
    } else {
      this.openIndices.set(new Set([index]));
    }
  }
}
