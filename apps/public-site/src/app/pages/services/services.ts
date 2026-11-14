import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '@org/ui';

interface Service {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent {
  readonly services: Service[] = [
    {
      icon: '🛠️',
      title: 'Custom Implementation',
      description:
        'Our solutions team works alongside yours to configure the platform around your existing workflows.',
    },
    {
      icon: '🎓',
      title: 'Onboarding & Training',
      description:
        'Get your whole team up to speed quickly with guided onboarding sessions and hands-on workshops.',
    },
    {
      icon: '🔗',
      title: 'Integration Support',
      description:
        'Connect the platform to the tools you already use, from CRMs to internal data warehouses.',
    },
    {
      icon: '📊',
      title: 'Analytics & Reporting',
      description:
        'Turn raw usage data into actionable insight with dashboards tailored to your business goals.',
    },
    {
      icon: '🧑‍💻',
      title: 'Dedicated Support',
      description:
        'Enterprise customers get a named point of contact who knows their account inside and out.',
    },
    {
      icon: '🚀',
      title: 'Performance Audits',
      description:
        'Periodic reviews to ensure your setup is running efficiently as your usage grows.',
    },
  ];
}
