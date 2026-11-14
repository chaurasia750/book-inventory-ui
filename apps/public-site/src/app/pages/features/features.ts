import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '@org/ui';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './features.html',
  styleUrl: './features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesComponent {
  readonly features: Feature[] = [
    {
      icon: '⚙️',
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks with a visual builder — no code required.',
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Real-time editing, comments, and shared workspaces keep everyone in sync.',
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Configurable alerts make sure the right people hear about the right things.',
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'A fully responsive experience means your team stays productive anywhere.',
    },
    {
      icon: '🔍',
      title: 'Powerful Search',
      description: 'Find anything instantly with full-text search across your entire workspace.',
    },
    {
      icon: '🧾',
      title: 'Audit Trails',
      description: 'Every change is tracked, so you always know who did what and when.',
    },
  ];
}
