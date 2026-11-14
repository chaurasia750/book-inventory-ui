import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeaderComponent } from '../public-header/public-header';
import { PublicFooterComponent } from '../public-footer/public-footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  readonly showBackToTop = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop.set(window.scrollY > 400);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
