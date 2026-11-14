import { Directive, ElementRef, HostListener, Input, OnDestroy, inject } from '@angular/core';

@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tipText = '';

  private readonly el = inject(ElementRef<HTMLElement>);
  private tip: HTMLElement | null = null;

  @HostListener('mouseenter')
  show(): void {
    if (!this.tipText) return;
    const rect = this.el.nativeElement.getBoundingClientRect();

    this.tip = document.createElement('div');
    this.tip.textContent = this.tipText;
    Object.assign(this.tip.style, {
      position: 'fixed',
      zIndex: '99999',
      maxWidth: '240px',
      padding: '6px 10px',
      borderRadius: '8px',
      background: '#074928',
      color: '#fff',
      fontSize: '11px',
      fontWeight: '500',
      lineHeight: '1.4',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      textOverflow: 'clip',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    });

    document.body.appendChild(this.tip);

    const tipW = this.tip.offsetWidth;
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    const top = rect.top - 8;

    this.tip.style.left = `${left}px`;
    this.tip.style.top = `${top}px`;

    requestAnimationFrame(() => {
      if (this.tip) {
        this.tip.style.top = `${rect.top - this.tip.offsetHeight - 6}px`;
        this.tip.style.opacity = '1';
      }
    });
  }

  @HostListener('mouseleave')
  hide(): void {
    this.removeTip();
  }

  ngOnDestroy(): void {
    this.removeTip();
  }

  private removeTip(): void {
    this.tip?.remove();
    this.tip = null;
  }
}
