import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent, CardComponent } from '@org/ui';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, ButtonComponent, CardComponent],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
  readonly tiers: PricingTier[] = [
    {
      name: 'Basic',
      price: '$19',
      period: '/month',
      description: 'For individuals and small teams just getting started.',
      features: [
        'Up to 5 team members',
        '10 GB storage',
        'Core dashboard & reporting',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For growing teams that need more power and control.',
      features: [
        'Up to 25 team members',
        '100 GB storage',
        'Advanced analytics',
        'Priority email support',
        'Custom integrations',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with advanced security and scale needs.',
      features: [
        'Unlimited team members',
        'Unlimited storage',
        'Dedicated account manager',
        'SSO & advanced security',
        'Custom SLAs',
      ],
    },
  ];
}
