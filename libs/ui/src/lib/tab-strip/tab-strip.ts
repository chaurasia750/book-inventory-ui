import { AfterViewChecked, Directive, ElementRef, inject } from '@angular/core';

/**
 * A row of tabs that can be wider than the screen (a phone). Place on the element that holds the tabs: `<div appTabStrip role="tablist">`.
 *
 * - It scrolls sideways only (`touch-action: pan-x`, no scroll chaining), so swiping the tabs never moves the page up or down.
 * - Its scrollbar is hidden; the cut-off tab shows that more are there.
 * - The active tab (`aria-selected="true"`) is scrolled to the middle of the row when it changes, by moving the row only,
 *   never the page.
 */
@Directive({
  selector: '[appTabStrip]',
  standalone: true,
  host: {
    class: 'relative overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  },
})
export class TabStripDirective implements AfterViewChecked {
  private readonly strip = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private shown: Element | null = null;

  ngAfterViewChecked(): void {
    const active = this.strip.querySelector('[aria-selected="true"]');
    if (!active || active === this.shown) {
      return;
    }
    this.shown = active;
    const tab = active.getBoundingClientRect();
    const row = this.strip.getBoundingClientRect();
    const left = tab.left - row.left + this.strip.scrollLeft - (row.width - tab.width) / 2;
    this.strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }
}
