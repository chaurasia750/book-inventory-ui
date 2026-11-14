import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-franchise',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './franchise.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .font-heading { font-family: 'Red Hat Display', serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }

    .banner-animate {
      animation: bannerZoom 8s ease-out forwards;
    }

    @keyframes bannerZoom {
      0% { transform: scale(1); }
      100% { transform: scale(1.08); }
    }
  `],
})
export class FranchiseComponent {
  readonly benefits = [
    { icon: 'fa fa-flask', title: 'Trusted Brand', desc: 'Partner with Book Inventory, a name associated with accuracy, quality and care in diagnostic services.' },
    { icon: 'fa fa-line-chart', title: 'High Growth Market', desc: 'The diagnostic industry is expanding rapidly across India — tap into a growing and recurring demand.' },
    { icon: 'fa fa-cogs', title: 'Complete Support', desc: 'We provide training, marketing support, operational guidance and technology assistance at every step.' },
    { icon: 'fa fa-users', title: 'B2B & Corporate Network', desc: 'Benefit from our established corporate tie-ups for pre-employment and annual health check submissions.' },
    { icon: 'fa fa-certificate', title: 'Quality Assurance', desc: 'Backed by stringent quality control, standardized reports and NABL-aligned processes.' },
    { icon: 'fa fa-money', title: 'Attractive Returns', desc: 'A transparent revenue model designed for sustainable growth and strong return on investment.' },
  ];

  readonly steps = [
    { title: 'Application', desc: 'Fill in the franchise enquiry form or contact our team to express your interest.' },
    { title: 'Discussion & Assessment', desc: 'Our team evaluates the location, infrastructure and market potential with you.' },
    { title: 'Agreement', desc: 'Sign the franchise agreement with clear terms, investment and support commitments.' },
    { title: 'Setup & Training', desc: 'We help set up the center and train your team on processes and operations.' },
    { title: 'Launch', desc: 'Start operations with our marketing support and ongoing operational guidance.' },
  ];

  readonly faqs = [
    { q: 'What is the investment required to start a Book Inventory franchise?', a: 'The investment depends on the city, center size and the services you plan to offer. Contact our franchise team for a detailed cost structure and projections based on your preferred location.', open: false },
    { q: 'Do I need a medical or pathological background?', a: 'Not necessarily. A business mindset along with a willingness to follow our operating standards is enough. We provide complete training and ongoing support so you can run the center successfully.', open: false },
    { q: 'Where can I open a franchise center?', a: 'We are expanding across India. You can set up a center in your city or locality subject to territory availability and market assessment by our team.', open: false },
    { q: 'What support will I receive after opening?', a: 'We provide continuous support including staff training, quality audits, marketing assistance, technology integration, and guidance for corporate tie-ups and B2B services.', open: false },
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}