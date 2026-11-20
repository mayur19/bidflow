import { assertCurrency, currencyExponent } from './currency.js';
import { DomainError } from './errors.js';
import { divideRoundHalfUp, MAX_SAFE_MINOR, toSafeNumber } from './rounding.js';

/**
 * Money is an integer count of minor units (cents for USD) plus a currency.
 * No floating-point arithmetic is ever performed on amounts (ADR-0013).
 */
export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

export function assertMinorUnits(value: number, label = 'amount'): number {
  if (!Number.isInteger(value)) {
    throw new DomainError('INVALID_AMOUNT', `${label} must be an integer number of minor units`);
  }
  if (Math.abs(value) > MAX_SAFE_MINOR) {
    throw new DomainError('AMOUNT_OVERFLOW', `${label} exceeds the safe integer range`);
  }
  return value;
}

export function money(amountMinor: number, currency: string): Money {
  return Object.freeze({
    amountMinor: assertMinorUnits(amountMinor),
    currency: assertCurrency(currency),
  });
}

export function zeroMoney(currency: string): Money {
  return money(0, currency);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new DomainError(
      'CURRENCY_MISMATCH',
      `Cannot combine ${a.currency} and ${b.currency} amounts`,
    );
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const total = toSafeNumber(BigInt(a.amountMinor) + BigInt(b.amountMinor), 'sum');
  return money(total, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const difference = toSafeNumber(BigInt(a.amountMinor) - BigInt(b.amountMinor), 'difference');
  return money(difference, a.currency);
}

export function sumMoney(items: readonly Money[], currency: string): Money {
  return items.reduce((total, item) => addMoney(total, item), zeroMoney(currency));
}

export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amountMinor === b.amountMinor ? 0 : a.amountMinor < b.amountMinor ? -1 : 1;
}

export function isPositive(amount: Money): boolean {
  return amount.amountMinor > 0;
}

/**
 * Parse an integer minor-unit value coming from storage (PostgreSQL bigint
 * arrives as a string). Rejects decimals, exponents and unsafe magnitudes.
 */
export function parseMinorUnits(value: string | number): number {
  if (typeof value === 'number') return assertMinorUnits(value);
  if (!/^-?\d{1,16}$/.test(value)) {
    throw new DomainError('INVALID_AMOUNT', `Not an integer minor-unit value: ${value}`);
  }
  return toSafeNumber(BigInt(value), 'amount');
}

/** Scale an amount by a ratio of integers, rounding once (ROUND HALF UP). */
export function scaleMoney(amount: Money, numerator: bigint, denominator: bigint): Money {
  const scaled = divideRoundHalfUp(BigInt(amount.amountMinor) * numerator, denominator);
  return money(toSafeNumber(scaled, 'scaled amount'), amount.currency);
}

/** Minor-unit factor for a currency, e.g. 100n for USD. */
export function minorFactor(currency: string): bigint {
  return 10n ** BigInt(currencyExponent(currency));
}
