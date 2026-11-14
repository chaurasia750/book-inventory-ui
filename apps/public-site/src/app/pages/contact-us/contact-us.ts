import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EnquiriesService, EnquiryRequest } from '../../services/enquiries.service';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [FormsModule, RouterLink, RevealDirective],
  templateUrl: './contact-us.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .font-heading { font-family: 'Red Hat Display', serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `]
})
export class ContactUsComponent {
  private readonly enquiriesService = inject(EnquiriesService);
  private readonly cdr = inject(ChangeDetectorRef);

  submitting = false;
  successMsg = '';
  errorMsg = '';

  contactReasons = [
    { icon: 'fa fa-info-circle', title: 'Product Information', desc: 'Need details about a vegetable, fruit, or specialty item? We provide complete availability and pricing information.' },
    { icon: 'fa fa-shopping-cart', title: 'Order Support', desc: 'Help with placing orders, modifying orders, or checking order status and delivery timelines.' },
    { icon: 'fa fa-truck', title: 'Delivery Queries', desc: 'Questions about delivery times, charges, tracking, or same-day delivery to your area? Just ask.' },
    { icon: 'fa fa-building', title: 'Bulk / Wholesale', desc: 'Families, hostels, restaurants, or offices — we offer special bulk and wholesale pricing on fresh produce.' },
    { icon: 'fa fa-leaf', title: 'Freshness & Quality', desc: 'Concerned about freshness? Our quality check is unconditional, and we replace or refund any item that is not up to the mark.' },
    { icon: 'fa fa-calendar', title: 'Seasonal Availability', desc: 'Wondering what is in season? We help you pick the freshest and most nutritious produce of the season.' },
    { icon: 'fa fa-credit-card', title: 'Payment Issues', desc: 'Facing issues with UPI, cards, net banking, or COD? We help resolve payment concerns quickly.' },
    { icon: 'fa fa-undo', title: 'Return & Refund', desc: 'Need to return an item or request a refund? Our hassle-free process has you covered.' },
  ];

  faqs = [
    { q: 'Where does Book Inventory source its fresh produce?', a: 'We source directly from local and partner farms across Delhi NCR and nearby regions — with no middlemen. This means fresher vegetables and fruits for you, fairer prices for our farmers, and maximum nutrition on your table.', open: false },
    { q: 'How do I place an order?', a: 'Ordering is easy. Call or WhatsApp us at +91 00000 00000, or fill out the contact form on this page with the items you need. Our team confirms your order, the delivery slot, and the total in advance, then takes care of the rest.', open: false },
    { q: 'Do you offer same-day delivery?', a: 'Yes. Orders placed in the morning are delivered the very same day. We use cold-chain logistics and insulated packaging so your produce stays fresh from the farm to your doorstep within hours.', open: false },
    { q: 'How fresh is the produce when it arrives?', a: 'Every item is picked fresh from the farm on delivery day, handpicked and quality-checked before dispatch. If anything arrives below our freshness standard, we replace it or refund you — no questions asked.', open: false },
    { q: 'Are your prices competitive?', a: 'Yes. Because we buy directly from farms and cut out middlemen, our prices are consistently fair and often lower than the market — with honest weights and zero hidden charges.', open: false },
    { q: 'How are my vegetables and fruits packed and delivered?', a: 'Produce is packed carefully in clean, food-safe packaging and delivered in temperature-controlled transport so everything arrives crisp, fresh, and undamaged.', open: false },
    { q: 'Do you offer weekly subscriptions or bulk orders?', a: 'Yes. We offer convenient weekly combos, family value baskets, and can arrange bulk or regular subscriptions for families, hostels, and offices. Call us to build a plan that suits you.', open: false },
    { q: 'How can I contact Book Inventory?', a: 'You can reach us through multiple channels: phone at +91 00000 00000 (Mon-Sat, 9 AM - 7 PM), WhatsApp at +91 00000 00000, by email, or by filling out the contact form on this page. Our team responds within 2-4 hours during business hours.', open: false },
    { q: 'How long does it take to receive a reply?', a: 'We respond to all inquiries within 2-4 hours during business hours (Mon-Sat, 9 AM - 7 PM). WhatsApp messages typically receive a response within minutes. Emails may take up to 24 hours on Sundays and holidays.', open: false },
    { q: 'Can I order fresh produce on WhatsApp?', a: 'Yes, absolutely. You can ask about today\u2019s produce, check prices, and place orders directly through WhatsApp. Simply send us a message with the items you want and our team will guide you through the entire process.', open: false },
    { q: 'How can I track my order?', a: 'Once your order is confirmed, we share the delivery slot and can provide real-time updates via WhatsApp and email. You can also call or WhatsApp us with your order number for an immediate status update.', open: false },
    { q: 'What if some item is not fresh when it arrives?', a: 'Just let us know within a few hours of delivery. We will replace the item on your next order or issue a refund right away — our freshness guarantee is unconditional.', open: false },
    { q: 'What payment methods do you accept?', a: 'We accept all major payment methods: UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, and cash on delivery for eligible orders. All online transactions are secured with 256-bit SSL encryption.', open: false },
    { q: 'Do you deliver across India?', a: 'Same-day delivery is currently available across major service areas in Delhi NCR. For other cities, please contact us and we will do our best to arrange a delivery or suggest the nearest service area.', open: false },
    { q: 'Do you offer bulk or wholesale pricing?', a: 'Yes, we offer special pricing for bulk orders, restaurant and hotel supplies, and wholesale buyers. Contact us with your requirements and we will provide a customized quote.', open: false },
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  onSubmit(form: any) {
    if (form.valid && !this.submitting) {
      this.submitting = true;
      this.successMsg = '';
      this.errorMsg = '';

      const formValue = form.value;
      const messageWithSubject = formValue.subject
        ? `[${formValue.subject}] ${formValue.message}`
        : formValue.message;

      const payload: EnquiryRequest = {
        name: formValue.name,
        phone: formValue.phone,
        email: formValue.email,
        message: messageWithSubject,
      };

      this.enquiriesService.submitEnquiry(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.successMsg = 'Thank you for reaching out! We will get back to you within 2-4 hours during business hours.';
          form.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMsg = 'Something went wrong. Please try again or reach us directly via WhatsApp at +91 00000 00000.';
          console.error('Enquiry submit failed:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
