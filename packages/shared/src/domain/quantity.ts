import { DomainError } from './errors.js';
import { toSafeNumber } from './rounding.js';

/**
 * Quantities are fixed-point integers in thousandths of a unit
 * ("milli-units"): 20 units = 20_000, 2.5 m = 2_500. This matches the
 * numeric(14,3) columns planned for request/RFQ/PO lines (ADR-0013).
 */
export const QUANTITY_SCALE = 1000;
const QUANTITY_DECIMALS = 3;

export function assertQuantityMilli(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DomainError('INVALID_QUANTITY', 'Quantity must be a positive amount');
  }
  return value;
}

/** Parse "20", "2.5" or "0.125" into milli-units. */
export function parseQuantity(input: string): number {
  const match = /^(\d+)(\.(\d+))?$/.exec(input.trim());
  if (!match) {
    throw new DomainError('INVALID_QUANTITY', 'Enter a positive quantity such as 20 or 2.5');
  }
  const fraction = match[3] ?? '';
  if (fraction.length > QUANTITY_DECIMALS) {
    throw new DomainError('INVALID_QUANTITY', 'Quantities allow at most 3 decimal places');
  }
  const milli = toSafeNumber(BigInt(`${match[1]}${fraction.padEnd(QUANTITY_DECIMALS, '0')}`));
  return assertQuantityMilli(milli);
}

/** Render milli-units without trailing zeros: 20000 -> "20", 2500 -> "2.5". */
export function formatQuantity(quantityMilli: number): string {
  const value = assertQuantityMilli(quantityMilli);
  const whole = Math.trunc(value / QUANTITY_SCALE);
  const fraction = (value % QUANTITY_SCALE).toString().padStart(QUANTITY_DECIMALS, '0');
  const trimmed = fraction.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : `${whole}`;
}
