import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent, EmptyStateComponent } from '@org/ui';

interface OpenPosition {
  title: string;
  location: string;
  type: string;
}

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CardComponent, EmptyStateComponent],
  templateUrl: './careers.html',
  styleUrl: './careers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareersComponent {
  readonly positions: OpenPosition[] = [
    { title: 'Senior Frontend Engineer', location: 'Remote', type: 'Full-time' },
    { title: 'Product Designer', location: 'San Francisco, CA', type: 'Full-time' },
    { title: 'Customer Success Manager', location: 'Remote', type: 'Full-time' },
    { title: 'DevOps Engineer', location: 'Austin, TX', type: 'Full-time' },
  ];
}
