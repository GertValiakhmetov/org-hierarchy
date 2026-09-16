/**
 * Split by what each layer can actually establish. The transport knows whether
 * the request arrived, what status came back and whether the body parsed as
 * JSON; it cannot know the expected shape, so only the validator may report
 * 'schema'. Keeping 'malformed' separate also keeps the invariant that a
 * 'schema' error always carries `issues`.
 */
export type ApiErrorKind = 'network' | 'http' | 'malformed' | 'schema';

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * `message` is diagnostic and never rendered: the UI derives its copy from
 * `kind` instead, so the same failure reads consistently wherever it surfaces.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Populated for kind === 'schema' only. */
  readonly issues: ValidationIssue[];

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; issues?: ValidationIssue[]; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.issues = options.issues ?? [];
  }
}

/** A cancelled request is not a failure: react-query handles it, the UI must not. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
