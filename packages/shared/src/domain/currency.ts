import { DomainError } from './errors.js';

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** ISO 4217 minor-unit exponents that differ from the default of 2. */
const NON_DEFAULT_EXPONENTS: Readonly<Record<string, number>> = {
  BHD: 3,
  CLP: 0,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KRW: 0,
  KWD: 3,
  OMR: 3,
  TND: 3,
  VND: 0,
};

const DEFAULT_EXPONENT = 2;

/** Validate and return an upper-case ISO 4217 style code (e.g. "USD"). */
export function assertCurrency(code: string): string {
  if (!CURRENCY_PATTERN.test(code)) {
    throw new DomainError('INVALID_CURRENCY', `Invalid currency code: ${code}`);
  }
  return code;
}

/** Number of minor-unit digits for a currency (USD 2, JPY 0, KWD 3). */
export function currencyExponent(code: string): number {
  return NON_DEFAULT_EXPONENTS[assertCurrency(code)] ?? DEFAULT_EXPONENT;
}
