import { currencyExponent } from './currency.js';
import { DomainError } from './errors.js';
import { assertMinorUnits, type Money } from './money.js';
import { toSafeNumber } from './rounding.js';

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function splitMinor(amountMinor: number, exponent: number) {
  const negative = amountMinor < 0;
  const digits = Math.abs(assertMinorUnits(amountMinor))
    .toString()
    .padStart(exponent + 1, '0');
  const major = digits.slice(0, digits.length - exponent);
  const minor = exponent === 0 ? '' : digits.slice(digits.length - exponent);
  return { negative, major, minor };
}

/**
 * Plain decimal string without grouping, for inputs and CSV ("-1234.50").
 * Built from the integer digits; never via floating point.
 */
export function formatMinorUnits(amountMinor: number, currency: string): string {
  const { negative, major, minor } = splitMinor(amountMinor, currencyExponent(currency));
  return `${negative ? '-' : ''}${major}${minor ? `.${minor}` : ''}`;
}

/** Display string with thousands separators and the ISO code: "USD 41,000.00". */
export function formatMoney(amount: Money): string {
  const { negative, major, minor } = splitMinor(
    amount.amountMinor,
    currencyExponent(amount.currency),
  );
  const body = `${groupThousands(major)}${minor ? `.${minor}` : ''}`;
  return `${amount.currency} ${negative ? '-' : ''}${body}`;
}

const MAJOR_INPUT = /^(\d{1,3}(,\d{3})+|\d+)(\.(\d+))?$/;

/**
 * Parse user-entered major units ("12,500.5") into minor units for a
 * currency. Rejects negatives, empty input and more decimals than the
 * currency allows instead of rounding them away.
 */
export function parseMajorUnits(input: string, currency: string): number {
  const exponent = currencyExponent(currency);
  const match = MAJOR_INPUT.exec(input.trim());
  if (!match) {
    throw new DomainError('INVALID_AMOUNT', 'Enter a non-negative amount such as 1250.00');
  }
  const whole = match[1]!.replace(/,/g, '');
  const fraction = match[4] ?? '';
  if (fraction.length > exponent) {
    throw new DomainError(
      'INVALID_AMOUNT',
      `${currency} amounts allow at most ${exponent} decimal places`,
    );
  }
  const minorDigits = `${whole}${fraction.padEnd(exponent, '0')}`;
  return toSafeNumber(BigInt(minorDigits), 'amount');
}
