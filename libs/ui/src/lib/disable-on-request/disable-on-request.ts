import { Directive, ElementRef, effect, inject } from '@angular/core';
import { PendingRequestsService } from '@org/shared-utils';

/**
 * Place on any `<button>` to auto-disable it while HTTP requests are in flight.
 *
 * Usage: `<button appDisableOnRequest>Save</button>`
 *
 * - Disables when `PendingRequestsService.activeRequests > 0`
 * - Never force-enables the button: the host's own `[disabled]` binding decides
 *   when it should be re-enabled, so a template `[disabled]` (form validation,
 *   `loading`, etc.) is never overridden by this directive.
 */
@Directive({
  selector: 'button[appDisableOnRequest]',
  standalone: true,
})
export class DisableOnRequestDirective {
  private readonly el = inject(ElementRef<HTMLButtonElement>);

  constructor() {
    const pending = inject(PendingRequestsService);
    effect(() => {
      if (pending.activeRequests() > 0) {
        this.el.nativeElement.disabled = true;
      }
    });
  }
}
