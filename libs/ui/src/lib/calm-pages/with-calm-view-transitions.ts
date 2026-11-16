import { inject } from '@angular/core';
import { Router, withViewTransitions } from '@angular/router';

/** The part of an address that names the screen: `/schools/12/edit` -> `schools`. */
function screenOf(url: string): string {
  return url.split(/[?#]/)[0].split('/').find((part) => part !== '') ?? '';
}

/**
 * The browser rejects a view transition with this error when the transition is skipped on purpose (Chrome rejects
 * `ready` with `AbortError: Transition was skipped. skipTransition() called`). Angular surfaces that rejection with
 * `console.error` in dev mode, so the deliberate skip below would otherwise leave an error in the console that
 * nobody can act on. Production never prints it.
 */
function isSkippedViewTransition(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError' &&
    /transition was skipped|skiptransition/i.test(error.message)
  );
}

let skippedTransitionLogSilenced = false;

/** Drops the one expected "skipped view transition" error from the dev console; every other log passes through. */
function silenceSkippedTransitionLog(): void {
  if (skippedTransitionLogSilenced) {
    return;
  }
  skippedTransitionLogSilenced = true;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (args.length === 1 && isSkippedViewTransition(args[0])) {
      return;
    }
    original.apply(console, args);
  };
}

/**
 * Platform U19 c: a change of page fades in softly through the browser's view transition (the style sheet `calm-pages.scss` sets
 * its length and the CSS fallback for browsers without one). Opening a record beside a list, closing it, or moving between
 * its tabs stays on the same screen and is not a page change, so it is not animated.
 */
export function withCalmViewTransitions() {
  silenceSkippedTransitionLog();
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
