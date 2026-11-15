import { inject } from '@angular/core';
import { Router, withViewTransitions } from '@angular/router';

/** The part of an address that names the screen: `/schools/12/edit` -> `schools`. */
function screenOf(url: string): string {
  return url.split(/[?#]/)[0].split('/').find((part) => part !== '') ?? '';
}

/**
 * Platform U19 c: a change of page fades in softly through the browser's view transition (the style sheet `calm-pages.scss` sets
 * its length and the CSS fallback for browsers without one). Opening a record beside a list, closing it, or moving between
 * its tabs stays on the same screen and is not a page change, so it is not animated.
 */
export function withCalmViewTransitions() {
  return withViewTransitions({
    skipInitialTransition: true,
    onViewTransitionCreated: ({ transition }) => {
      const router = inject(Router);
      const target = router.currentNavigation()?.extractedUrl;
      if (target && screenOf(router.url) === screenOf(router.serializeUrl(target))) {
        transition.skipTransition();
      }
    },
  });
}
