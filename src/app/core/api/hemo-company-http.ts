import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, mergeMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../Services/api-client';

// HEMO-specific transport adapter. Reuse company HttpClient/Interceptor and
// generated-client base URL. Company 400 handling expects Blob errors.
@Injectable({ providedIn: 'root' })
export class HemoCompanyHttp {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL).replace(/\/+$/, '');

  get<T>(path: string, options: {params?: HttpParams} = {}): Observable<T> {
    return this.request<T>('GET', path, undefined, options.params);
  }
  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('POST', path, body);
  }
  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', path, body);
  }

  private request<T>(method: string, path: string, body?: unknown, params?: HttpParams): Observable<T> {
    if (!path.startsWith('/Identity/')) return throwError(() => new Error('Invalid HEMO API path'));
    return this.http.request(method, this.base + path, {
      body, params, responseType: 'blob', headers: {Accept: 'application/json'}
    }).pipe(
      mergeMap(blob => from(this.decode<T>(blob))),
      catchError(error => from(this.normalizeError(error)).pipe(mergeMap(e => throwError(() => e))))
    );
  }

  private async decode<T>(blob: Blob | null): Promise<T> {
    if (!blob || blob.size === 0) return undefined as T;
    const text = await blob.text();
    return JSON.parse(text) as T;
  }

  private async normalizeError(error: unknown): Promise<unknown> {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) return error;
    let detail: unknown = null;
    try { detail = JSON.parse(await error.error.text()); } catch { /* keep status, do not expose raw HTML */ }
    return new HttpErrorResponse({
      error: detail, headers: error.headers, status: error.status,
      statusText: error.statusText, url: error.url ?? undefined
    });
  }
}
