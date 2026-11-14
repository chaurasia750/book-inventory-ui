import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  @Input() appTooltip = '';

  private tooltipElement: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.appTooltip || this.tooltipElement) {
      return;
    }

    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private show(): void {
    const host = this.elementRef.nativeElement;
    const hostRect = host.getBoundingClientRect();

    const tooltip = this.renderer.createElement('div') as HTMLElement;
    const text = this.renderer.createText(this.appTooltip);
    this.renderer.appendChild(tooltip, text);

    this.renderer.setStyle(tooltip, 'position', 'absolute');
    this.renderer.setStyle(tooltip, 'top', `${hostRect.top + window.scrollY - 30}px`);
    this.renderer.setStyle(tooltip, 'left', `${hostRect.left + window.scrollX}px`);
    this.renderer.setStyle(tooltip, 'background', 'rgba(0, 0, 0, 0.85)');
    this.renderer.setStyle(tooltip, 'color', '#fff');
    this.renderer.setStyle(tooltip, 'padding', '4px 8px');
    this.renderer.setStyle(tooltip, 'border-radius', '4px');
    this.renderer.setStyle(tooltip, 'font-size', '12px');
    this.renderer.setStyle(tooltip, 'white-space', 'nowrap');
    this.renderer.setStyle(tooltip, 'z-index', '10000');
    this.renderer.setStyle(tooltip, 'pointer-events', 'none');

    this.renderer.appendChild(document.body, tooltip);
    this.tooltipElement = tooltip;
  }

  private hide(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}
