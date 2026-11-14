import { Directive, ElementRef, inject, input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

/**
 * GET media/view/{id} requires the same bearer auth as every other endpoint (it also serves KYC
 * documents, so it can't be made anonymous the way a plain avatar URL usually would be). A native
 * `<img [src]="url">` is a browser-native request, not one of Angular's HttpClient calls, so the
 * auth interceptor never gets a chance to attach the token -- every profile photo and document
 * preview built against a raw media URL 401s silently, rendering as nothing rather than a broken
 * icon most people would have noticed.
 *
 * `[secureSrc]` replaces `[src]` on the same element: it fetches the URL through HttpClient (token
 * attached, exactly like any other API call), turns the response into an object URL, and only then
 * points the `<img>` at it. Swap `[src]="url"` for `[secureSrc]="url"` and nothing else changes.
 */
@Directive({
  selector: 'img[secureSrc]',
  standalone: true,
})
export class SecureImgDirective implements OnChanges, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly el = inject(ElementRef<HTMLImageElement>);

  readonly secureSrc = input<string | null | undefined>();

  private objectUrl: string | null = null;
  private subscription: Subscription | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!('secureSrc' in changes)) return;

    this.subscription?.unsubscribe();
    this.releaseObjectUrl();

    const url = this.secureSrc();
    if (!url) {
      this.el.nativeElement.removeAttribute('src');
      return;
    }

    // A data: URI (an initials-fallback avatar drawn locally, not fetched from the API) is not an
    // HTTP request to authenticate -- set it directly rather than handing it to HttpClient.
    if (!/^https?:\/\//i.test(url)) {
      this.el.nativeElement.src = url;
      return;
    }

    this.subscription = this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.el.nativeElement.src = this.objectUrl;
      },
      // A missing/unauthorized image should disappear quietly, the same as a broken src would.
      error: () => this.el.nativeElement.removeAttribute('src'),
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.releaseObjectUrl();
  }

  private releaseObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
