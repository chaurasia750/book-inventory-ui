import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
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

/**
 * A route parameter of the page's own route or of the routes under it, or null (spec platform U16: every tab has its own address,
 * so a tab can be linked from outside the page). Like {@link injectSelectedId} it reads the whole snapshot tree, so it is right at
 * every moment. The tab of a record beside a list is the `tab` parameter of the child route `:id/:tab`; a page that is itself the
 * route reads its own `:tab`.
 */
export function injectRouteParam(name: string): Signal<string | null> {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const read = (): string | null => {
    let node: ActivatedRouteSnapshot | null = route.snapshot;
    while (node) {
      const value = node.paramMap.get(name);
      if (value !== null) return value;
      node = node.firstChild;
    }
    return null;
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
