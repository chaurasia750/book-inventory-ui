import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styles: [`
    :host { display: block; }

    @keyframes kenBurns {
      from { transform: scale(1); }
      to { transform: scale(1.04); }
    }

    .slide-active img { animation: kenBurns 7s ease-out forwards; }

    @media (prefers-reduced-motion: reduce) {
      .slide-active img { animation: none; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly currentSlide = signal(0);
  private slideInterval: ReturnType<typeof setInterval> | null = null;

  readonly whatsappOrderUrl =
    'https://wa.me/910000000000?text=Hi%20Book%20Inventory%2C%20I%20would%20like%20to%20place%20an%20order.';

  heroSlides = [
    'assets/book_inventory.png',
    'assets/book_inventory.png',
  ];

  highlights = [
    { icon: 'fa fa-leaf', title: '100% Fresh', desc: 'Picked the same day' },
    { icon: 'fa fa-shield', title: 'Hygienic Packing', desc: 'Clean, food-safe packs' },
    { icon: 'fa fa-truck', title: 'Fast Delivery', desc: 'Same-day to your door' },
    { icon: 'fa fa-rupee', title: 'Best Prices', desc: 'No hidden charges' },
  ];

  welcomePoints = [
    'Sourced directly from local farms',
    'Quality-checked before every dispatch',
    'Honest weighing and transparent pricing',
  ];

  whyUs = [
    { icon: 'fa fa-truck', title: 'Same-Day Delivery', desc: 'Fresh produce delivered within hours of ordering' },
    { icon: 'fa fa-leaf', title: 'Farm Direct', desc: 'Sourced straight from local farmers, no middlemen' },
    { icon: 'fa fa-shield', title: 'Quality Assured', desc: 'Every item quality-checked before dispatch' },
    { icon: 'fa fa-tag', title: 'Best Prices', desc: 'Wholesale rates, no hidden charges' },
  ];

  steps = [
    { icon: 'fa fa-whatsapp', title: 'Place Your Order', desc: 'Call, WhatsApp, or send us a message with the items you need.' },
    { icon: 'fa fa-check-circle', title: 'We Pick It Fresh', desc: 'Your produce is handpicked, sorted, and packed hygienically.' },
    { icon: 'fa fa-truck', title: 'Delivered Same Day', desc: 'Your fresh basket arrives at your doorstep within hours.' },
  ];

  categories = [
    {
      name: 'Green Leafy Vegetables',
      desc: 'Fresh spinach, fenugreek, coriander, and seasonal greens picked the same day.',
      price: '₹20',
      oldPrice: '₹35',
      badge: 'Fresh',
      image: 'assets/GreenLeafy_vegetables.png'
    },
    {
      name: 'Seasonal Vegetables',
      desc: 'Farm-fresh potatoes, onions, carrots, beetroot, and ginger sourced from local farms.',
      price: '₹30',
      oldPrice: '₹50',
      badge: 'Seasonal',
      image: 'assets/Seasonal_vegetables.png'
    },
    {
      name: 'Seasonal Fruits',
      desc: 'Handpicked mangoes, bananas, apples, and seasonal fruits at the best prices.',
      price: '₹40',
      oldPrice: '₹65',
      badge: 'Popular',
      image: 'assets/Seasonal_fruits.png'
    },
    {
      name: 'Exotic & Specialty',
      desc: 'Broccoli, zucchini, mushrooms, and specialty items for gourmet cooking.',
      price: '₹55',
      oldPrice: '₹80',
      badge: 'Premium',
      image: 'assets/Exotic_Specialty.png'
    },
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  prevSlide() {
    const count = this.heroSlides.length;
    this.currentSlide.update((i) => (i - 1 + count) % count);
    this.startAutoSlide();
  }

  nextSlide() {
    this.currentSlide.update((i) => (i + 1) % this.heroSlides.length);
    this.startAutoSlide();
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.startAutoSlide();
  }

  private startAutoSlide() {
    this.stopAutoSlide();
    this.slideInterval = setInterval(
      () => this.currentSlide.update((i) => (i + 1) % this.heroSlides.length),
      6000,
    );
  }

  private stopAutoSlide() {
    if (this.slideInterval !== null) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }
}
