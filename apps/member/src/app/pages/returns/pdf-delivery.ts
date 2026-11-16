import { Observable } from 'rxjs';

/** What a screen does while a PDF is made: show the spinner, and show the API's message when it fails. */
export interface PdfHandlers {
  busy: (value: boolean) => void;
  failed: (error: unknown) => void;
}

const REVOKE_AFTER_MS = 60_000;

/** The PDF opens in a new tab for the browser's print dialog; the tab is opened first so a pop-up blocker allows it (sales R68, R71). */
export function printPdf(source: Observable<Blob>, handlers: PdfHandlers): void {
  const tab = window.open('', '_blank');
  fetchPdf(source, handlers, (url) => {
    if (tab) tab.location.href = url;
  }, () => tab?.close());
}

/** The PDF is saved as a file named after the document number, its slashes written as dashes (sales R68, R71). */
export function downloadPdf(source: Observable<Blob>, number: string, handlers: PdfHandlers): void {
  fetchPdf(source, handlers, (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = number.split('/').join('-') + '.pdf';
    link.click();
  });
}

function fetchPdf(source: Observable<Blob>, handlers: PdfHandlers, use: (objectUrl: string) => void, onError?: () => void): void {
  handlers.busy(true);
  source.subscribe({
    next: (blob) => {
      handlers.busy(false);
      const url = URL.createObjectURL(blob);
      use(url);
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
    },
    error: (error: unknown) => {
      handlers.busy(false);
      handlers.failed(error);
      onError?.();
    },
  });
}
