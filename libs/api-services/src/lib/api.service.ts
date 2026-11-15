import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';

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

  get<T>(url: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.resolve(url), { params: toHttpParams(params) });
  }

  /** A binary answer (a PDF): the file as a Blob. */
  getBlob(url: string, params?: QueryParams): Observable<Blob> {
    return this.http.get(this.resolve(url), { params: toHttpParams(params), responseType: 'blob' });
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
