import { assertCurrency } from './currency.js';
import { DomainError } from './errors.js';
import { money, type Money } from './money.js';
import { assertQuantityMilli, QUANTITY_SCALE } from './quantity.js';
import { divideRoundHalfUp, toSafeNumber } from './rounding.js';

/**
 * Safe unit price × quantity. The product is computed exactly in BigInt and
 * rounded once to the minor unit (ROUND HALF UP). Throws AMOUNT_OVERFLOW
 * rather than losing precision.
 *
 *   USD 18.50 × 2.5 units  =  1850 × 2500 / 1000  =  4625  (USD 46.25)
 */
export function multiplyByQuantity(unitPrice: Money, quantityMilli: number): Money {
  if (unitPrice.amountMinor < 0) {
    throw new DomainError('INVALID_AMOUNT', 'Unit price cannot be negative');
  }
  const exact = BigInt(unitPrice.amountMinor) * BigInt(assertQuantityMilli(quantityMilli));
  const rounded = divideRoundHalfUp(exact, BigInt(QUANTITY_SCALE));
  return money(toSafeNumber(rounded, 'line total'), assertCurrency(unitPrice.currency));
}
