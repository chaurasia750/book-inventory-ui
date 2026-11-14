/**
 * RFC 9457 problem details as the new API returns them for every error.
 * `code` is the stable message code (for example `iam.auth.invalid_credentials`) used to look up the text in the
 * message catalogue; `errors` is present for model-validation failures (field -> messages).
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}
