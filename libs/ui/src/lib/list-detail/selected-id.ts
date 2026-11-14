import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * The id of the record open beside a list (spec platform U10): the `id` parameter of the child route of the page's own
 * route, or null when only the list is shown. It reads the route's snapshot tree, which is whole at every moment. Call it
 * in the page component; the page's route must have a child route `:id`.
 */
export function injectSelectedId(): Signal<string | null> {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const read = (): string | null => route.snapshot.firstChild?.paramMap.get('id') ?? null;
  return toSignal(
    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(read),
    ),
    { initialValue: read() },
  );
}
