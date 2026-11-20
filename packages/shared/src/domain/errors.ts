/**
 * Errors raised by pure domain functions. The API maps them to a 422
 * VALIDATION_FAILED envelope carrying `details.domainCode`.
 */
export const DOMAIN_ERROR_CODES = [
  'INVALID_AMOUNT',
  'AMOUNT_OVERFLOW',
  'INVALID_CURRENCY',
  'CURRENCY_MISMATCH',
  'INVALID_QUANTITY',
  'INVALID_RATE',
  'INVALID_CRITERIA',
  'INVALID_SCORE',
  'INVALID_BID',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;

  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
