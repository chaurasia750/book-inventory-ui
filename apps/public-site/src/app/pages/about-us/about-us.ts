import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './about-us.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .font-heading { font-family: 'Red Hat Display', serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `]
})
export class AboutUsComponent {
  values = [
    { icon: 'fa fa-leaf', title: 'Freshness First', desc: 'Every item is sourced daily and quality-checked before dispatch, because we know your family deserves only the freshest produce — no exceptions.' },
    { icon: 'fa fa-certificate', title: 'Quality Assurance', desc: 'We follow strict quality checks at every stage — from farm sourcing to packaging and delivery — so what you receive is always fresh and dependable.' },
    { icon: 'fa fa-shield', title: 'Trust & Transparency', desc: 'We give honest weights, clear pricing, and honest service. No hidden mark-ups, no inflated costs — just trustworthy fresh food you can rely on.' },
    { icon: 'fa fa-handshake-o', title: 'Customer First', desc: 'From a warm phone call to careful, hygienic packaging, every step is designed around your convenience, comfort, and complete satisfaction.' },
    { icon: 'fa fa-clock-o', title: 'On-Time Delivery', desc: 'We respect your time. Orders are delivered same day within the promised slot, so your produce is always fresh and never delayed.' },
    { icon: 'fa fa-rupee', title: 'Affordable Prices', desc: 'Fresh, healthy food should not be a luxury. We keep our prices fair and transparent so everyone can put good food on the table.' },
  ];

  whyUs = [
    { icon: 'fa fa-leaf', title: 'Farm Direct', desc: 'We source directly from local farms with no middlemen, so you get the freshest produce at the best prices.' },
    { icon: 'fa fa-truck', title: 'Same-Day Delivery', desc: 'Order in the morning and get farm-fresh vegetables and fruits delivered to your doorstep the very same day.' },
    { icon: 'fa fa-balance-scale', title: 'Honest Weighing', desc: 'Every order is weighed accurately and packed honestly — no padding, no tricks, just fair trade you can trust.' },
    { icon: 'fa fa-users', title: 'Farmer Partnerships', desc: 'We work closely with local farmers, ensuring fair prices for them and quality produce for your family.' },
    { icon: 'fa fa-heart', title: 'Quality & Nutrition', desc: 'Carefully selected seasonal produce retains maximum nutrition, helping your family eat healthy every day.' },
    { icon: 'fa fa-smile-o', title: 'Friendly Support', desc: 'Our helpful team guides you on selection, seasonal availability, and delivery — at every step of your order.' },
  ];

  qualitySteps = [
    { icon: 'fa fa-shopping-cart', title: 'Order Online', desc: 'Call, WhatsApp, or order online and pick your fresh produce' },
    { icon: 'fa fa-leaf', title: 'Fresh Harvest', desc: 'Fruits and vegetables are picked fresh from partner farms the same day' },
    { icon: 'fa fa-check-circle', title: 'Quality Check', desc: 'Every item is inspected, washed, and sorted for freshness and size' },
    { icon: 'fa fa-archive', title: 'Hygienic Packing', desc: 'Produce is packed carefully in clean, food-safe packaging' },
    { icon: 'fa fa-truck', title: 'Same-Day Delivery', desc: 'Delivered fresh to your doorstep within hours of harvest' },
  ];

  productCategories = [
    { icon: 'fa fa-leaf', title: 'Leafy Greens', desc: 'Spinach, fenugreek, coriander, mint, and seasonal greens harvested fresh daily for maximum nutrition and flavour.' },
    { icon: 'fa fa-circle', title: 'Root Vegetables', desc: 'Farm-fresh potatoes, onions, carrots, beetroot, radish, and ginger — the daily staples every kitchen needs.' },
    { icon: 'fa fa-apple', title: 'Seasonal Fruits', desc: 'Handpicked mangoes, bananas, apples, oranges, guava, and in-season fruits delivered at their ripest best.' },
    { icon: 'fa fa-tasks', title: 'Daily Staples', desc: 'Tomatoes, beans, brinjal, cauliflower, capsicum, and the everyday vegetables trusted by home cooks across the city.' },
    { icon: 'fa fa-flask', title: 'Exotic & Specialty', desc: 'Broccoli, zucchini, mushrooms, lettuce, and specialty greens for gourmet cooking and healthy salads.' },
    { icon: 'fa fa-plus-square', title: 'Herbs & More', desc: 'Fresh herbs, green chilli, ginger-garlic, and pantry produce to bring complete flavour to your meals.' },
  ];

  courseModules = [
    {
      icon: 'fa fa-leaf',
      title: 'Farm-Fresh Guarantee',
      desc: 'Every single item we deliver is sourced directly from local farms on the day of delivery. If anything does not meet our freshness standards, we replace it or refund you — no questions asked.',
      open: false,
    },
    {
      icon: 'fa fa-truck',
      title: 'Same-Day Fresh Delivery',
      desc: 'Order by morning and receive your produce the same day. Our logistics team and cold-chain transport keep your vegetables and fruits fresh from the farm to your doorstep in hours.',
      open: false,
    },
    {
      icon: 'fa fa-balance-scale',
      title: 'Honest Weighing & Pricing',
      desc: 'We weigh every order accurately and price everything transparently. What you see online is exactly what you pay — no hidden mark-ups, no underweight bags, ever.',
      open: false,
    },
    {
      icon: 'fa fa-heart',
      title: 'Quality & Nutrition Promise',
      desc: 'We handpick seasonal produce at peak ripeness so it is packed with maximum nutrition and taste. Fresh, healthy food for your family, every single time.',
      open: false,
    },
  ];

  liveProjects = [
    {
      icon: 'fa fa-leaf',
      title: 'Fresh Leafy Greens',
      desc: 'Spinach, fenugreek, coriander, and seasonal greens — crisp, clean, and full of nutrients, picked fresh the very morning of delivery.',
      open: false,
    },
    {
      icon: 'fa fa-circle',
      title: 'Onion, Potato & Tomato',
      desc: 'The everyday trio every Indian kitchen needs — firm, ripe, and always in stock at honest prices.',
      open: false,
    },
    {
      icon: 'fa fa-apple',
      title: 'Seasonal Fruit Basket',
      desc: 'A handpicked mix of in-season fruits — mangoes, bananas, apples, and more — delivered ripe and ready to eat.',
      open: false,
    },
    {
      icon: 'fa fa-tasks',
      title: 'Daily Vegetable Combo',
      desc: 'A convenient weekly combo of mixed seasonal vegetables, packed fresh — perfect for busy families who want variety without planning.',
      open: false,
    },
    {
      icon: 'fa fa-flask',
      title: 'Exotic Vegetable Pack',
      desc: 'Broccoli, zucchini, mushrooms, bell peppers, and specialty greens for health-conscious cooking and gourmet salads.',
      open: false,
    },
    {
      icon: 'fa fa-plus-square',
      title: 'Fresh Herbs & Chillies',
      desc: 'Coriander, mint, curry leaves, green chilli, and ginger-garlic to bring complete flavour and aroma to every meal.',
      open: false,
    },
    {
      icon: 'fa fa-leaf',
      title: 'Root Vegetables Pack',
      desc: 'Carrots, beetroot, radish, sweet potato, and yam — versatile, nutritious, and perfect for wholesome cooking.',
      open: false,
    },
    {
      icon: 'fa fa-shopping-bag',
      title: 'Family Value Basket',
      desc: 'A budget-friendly basket of everyday staples, sized for a whole week and priced to keep your kitchen fully stocked.',
      open: false,
    },
  ];

  faqs = [
    { q: 'When was Book Inventory founded and why?', a: 'Book Inventory was founded with a simple belief — that every family deserves access to fresh, honest, affordable produce. Tired of wilted vegetables, unfair weights, and opaque market pricing, we set up a farm-direct online market committed to freshness, transparency, and customer-first service. What started as a single vegetable cart has grown into a trusted name in fresh delivery.', open: false },
    { q: 'How do I place an order?', a: 'Ordering is easy. Call or WhatsApp us, or use the contact form on our website with the items you need. Our team confirms your order, the delivery slot, and the total in advance, then takes care of the rest.', open: false },
    { q: 'Do you offer same-day delivery?', a: 'Yes. Orders placed in the morning are delivered the very same day. We source from local farms, pack hygienically, and deliver through our cold-chain logistics so your produce stays fresh from farm to doorstep.', open: false },
    { q: 'Where does your produce come from?', a: 'We source directly from local and partner farms across Delhi NCR and nearby regions — no middlemen. This means fresher produce for you and a fairer price for our hardworking farmers.', open: false },
    { q: 'How is the quality of your vegetables and fruits?', a: 'Every item is handpicked, inspected, and quality-checked before dispatch. If anything arrives below our freshness standard, we replace it or refund you — no questions asked.', open: false },
    { q: 'Are your prices competitive?', a: 'Yes. Because we buy directly from farms and cut out middlemen, our prices are consistently fair and often lower than the market — with honest weights and zero hidden charges.', open: false },
    { q: 'How are my vegetables packed and delivered?', a: 'Produce is packed carefully in clean, food-safe packaging and delivered in insulated, temperature-controlled transport so everything arrives crisp, fresh, and undamaged.', open: false },
    { q: 'What should I do if an item is not fresh?', a: 'Just let us know within a few hours of delivery. We will replace the item on your next order or issue a refund right away — our freshness guarantee is unconditional.', open: false },
    { q: 'Do you offer weekly subscriptions or bulk orders?', a: 'Yes. We offer convenient weekly combos and family value baskets, and can arrange bulk or regular subscriptions for families, hostels, and offices. Call us to build a plan that suits you.', open: false },
    { q: 'How can I contact Book Inventory?', a: 'You can reach us by phone, on WhatsApp, by email, or through the contact form on this website. Our team typically responds within 2-4 hours during business hours.', open: false },
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  toggleItem(item: { open: boolean }) {
    item.open = !item.open;
  }
}
