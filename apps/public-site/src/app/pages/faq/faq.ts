import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccordionComponent, AccordionItem } from '@org/ui';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [AccordionComponent],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  readonly items: AccordionItem[] = [
    {
      title: 'How does the free trial work?',
      content:
        'Every plan comes with a 14-day free trial with full access to all features. No credit card is ' +
        'required to start, and you can cancel at any time before the trial ends without being charged.',
    },
    {
      title: 'Can I change plans later?',
      content:
        'Yes. You can upgrade or downgrade your plan at any time from your account settings. Changes take ' +
        'effect immediately, and any billing differences are prorated automatically.',
    },
    {
      title: 'Do you offer discounts for nonprofits or education?',
      content:
        'We do. Nonprofit organizations and educational institutions receive a 30% discount on all paid ' +
        'plans. Reach out to our support team with proof of status to get set up.',
    },
    {
      title: 'What kind of support is included?',
      content:
        'All plans include email support with a target response time of one business day. Pro and ' +
        'Enterprise plans include priority support and, for Enterprise, a dedicated account manager.',
    },
    {
      title: 'Is my data secure?',
      content:
        'Yes. All data is encrypted in transit and at rest. We undergo regular third-party security audits ' +
        'and offer SSO and advanced access controls on our Enterprise plan.',
    },
    {
      title: 'How do I cancel my subscription?',
      content:
        'You can cancel at any time from the billing section of your account settings. You will retain ' +
        'access until the end of your current billing period, and no further charges will be made.',
    },
  ];
}
