import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { ProblemDetails } from '@org/shared-models';

/** Only used when the message catalogue itself could not be loaded. */
const CATALOGUE_UNAVAILABLE = 'Something went wrong. Please try again.';

interface Analysis {
  problem: ProblemDetails | null;
  /** Catalogue keys to try, most specific first. */
  keys: string[];
  /** A model-validation message sent by the API, used before the status/generic texts. */
  validationMessage?: string;
}

function analyse(error: unknown): Analysis {
  const http = error instanceof HttpErrorResponse ? error : null;
  const problem: ProblemDetails | null =
    http?.error && typeof http.error === 'object' ? (http.error as ProblemDetails) : null;

  const keys: string[] = [];
  if (http?.status === 0) keys.push('errors.network');
  if (problem?.code) keys.push(`errors.${problem.code}`);
  const validationMessage = problem?.errors ? Object.values(problem.errors).flat()[0] : undefined;
  if (http && http.status !== 0) keys.push(`errors.http.${http.status}`);
  keys.push('errors.generic');
  return { problem, keys, validationMessage };
}

function pick(analysis: Analysis, textFor: (key: string) => string | null): string {
  const { keys, validationMessage } = analysis;
  const network = keys.includes('errors.network') ? textFor('errors.network') : null;
  if (network) return network;

  const byCode = keys.find((k) => !k.startsWith('errors.http.') && k !== 'errors.generic' && k !== 'errors.network');
  const codeText = byCode ? textFor(byCode) : null;
  if (codeText) return codeText;

  if (validationMessage) return validationMessage;

  for (const key of keys.filter((k) => k.startsWith('errors.http.') || k === 'errors.generic')) {
    const text = textFor(key);
    if (text) return text;
  }
  return CATALOGUE_UNAVAILABLE;
}

/**
 * The text to show for a failed API call, taken from the message catalogue (`assets/i18n/en.json`), in this order:
 * `errors.network` when the server could not be reached; `errors.<code>` when the API sent a message code
 * (RFC 9457 problem details `code`); the first model-validation message; `errors.http.<status>`; `errors.generic`.
 * The problem details are passed as translation parameters, so a text can use `{{retryAfterSeconds}}` etc.
 * Synchronous: use it in pages, where the catalogue is already loaded.
 */
export function messageForError(error: unknown, translate: TranslateService): string {
  const analysis = analyse(error);
  return pick(analysis, (key) => {
    const text = translate.instant(key, analysis.problem ?? undefined);
    return typeof text === 'string' && text !== key ? text : null;
  });
}

/** Same as {@link messageForError} but waits until the catalogue is loaded (errors can arrive during start-up). */
export function messageForError$(error: unknown, translate: TranslateService): Observable<string> {
  const analysis = analyse(error);
  return translate.get(analysis.keys, analysis.problem ?? undefined).pipe(
    map((texts: Record<string, string>) =>
      pick(analysis, (key) => (typeof texts[key] === 'string' && texts[key] !== key ? texts[key] : null)),
    ),
  );
}
