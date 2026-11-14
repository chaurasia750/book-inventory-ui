import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { CompanyService } from '@org/api-services';
import { APP_URLS } from '@org/constants';

/**
 * The signed-in company's address segment (platform spec U12, company R15), asked once from `companies/current` and kept.
 * `undefined` means it could not be read (for example while a forced password change blocks the call): the address is then
 * left as it is. `null` means the user has no company.
 */
@Injectable({ providedIn: 'root' })
export class CompanyAddress {
  private readonly companies = inject(CompanyService);
  private known: string | null | undefined;

  slug(): Observable<string | null | undefined> {
    if (this.known !== undefined) return of(this.known);

    return this.companies.current().pipe(
      map((view) => view.company?.slug ?? null),
      tap((slug) => (this.known = slug)),
      catchError(() => of(undefined)),
    );
  }
}

/**
 * U12: the app's address must carry the signed-in company's slug. A different one (another company's, or the old `/member`)
 * is replaced by the right one with a full navigation, because the app's base address is read from the address at start;
 * a user without a company (a Super Admin) goes to `/admin`.
 */
export const companyAddressGuard: CanActivateFn = (_route, state) =>
  inject(CompanyAddress)
    .slug()
    .pipe(
      map((slug) => {
        if (slug === undefined) return true;
        if (slug === null) {
          window.location.replace(APP_URLS.ADMIN);
          return false;
        }

        if (window.location.pathname.split('/')[1] === slug) return true;

        window.location.replace(`/${slug}${state.url}`);
        return false;
      }),
    );
