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

/** What the panel beside a list shows (spec platform U10): a record, the form for a new one, or the form to edit one. */
export type PanelMode = 'view' | 'new' | 'edit';

export interface PanelState {
  mode: PanelMode | null;
  id: string | null;
}

/**
 * The state of the panel beside a list, from the child routes `new`, `:id` and `:id/edit` of the page's own route. `mode` is
 * null while only the list is shown. Like {@link injectSelectedId} it reads the whole snapshot tree.
 */
export function injectPanelState(): Signal<PanelState> {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const read = (): PanelState => {
    const child = route.snapshot.firstChild;
    const path = child?.routeConfig?.path;
    if (path === 'new') return { mode: 'new', id: null };
    if (!child) return { mode: null, id: null };
    return { mode: path?.endsWith('/edit') ? 'edit' : 'view', id: child.paramMap.get('id') };
  };
  return toSignal(
    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(read),
    ),
    { initialValue: read() },
  );
}
