import { AfterViewInit, Directive, ElementRef, OnDestroy, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { class: 'reveal' },
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  readonly revealDelay = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    if (!this.isBrowser || typeof IntersectionObserver === 'undefined') {
      node.classList.add('reveal-visible');
      return;
    }

    node.style.transitionDelay = `${this.revealDelay()}ms`;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('reveal-visible');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
