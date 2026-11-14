import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import { SKIP_ERROR_TOAST } from './http-context';

export type QueryParams = Record<string, string | number | boolean | undefined>;

function toHttpParams(params?: QueryParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) return httpParams;
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return httpParams;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Prefixes relative paths with the environment's API_BASE_URL; absolute URLs pass through unchanged. */
  private resolve(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /** `quiet` leaves a failure to the caller: no error toast (the page shows its own inline state). */
  get<T>(url: string, params?: QueryParams, options?: { quiet?: boolean }): Observable<T> {
    const context = options?.quiet ? new HttpContext().set(SKIP_ERROR_TOAST, true) : undefined;
    return this.http.get<T>(this.resolve(url), { params: toHttpParams(params), context });
  }

  post<T>(url: string, body: unknown, options?: { withCredentials?: boolean }): Observable<T> {
    return this.http.post<T>(this.resolve(url), body, options);
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.resolve(url), body);
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.resolve(url), body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.resolve(url));
  }
}
