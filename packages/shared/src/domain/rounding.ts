import { DomainError } from './errors.js';

/**
 * The single rounding rule for every monetary and scoring calculation in
 * BidFlow (ADR-0013): ROUND HALF UP, i.e. half away from zero, applied once
 * at the end of an exact integer (BigInt) computation.
 *
 *   divideRoundHalfUp(5n, 2n)  ===  3n   (2.5  -> 3)
 *   divideRoundHalfUp(-5n, 2n) === -3n   (-2.5 -> -3)
 *   divideRoundHalfUp(7n, 3n)  ===  2n   (2.33 -> 2)
 */
export function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new DomainError('INVALID_AMOUNT', 'Denominator must be a positive integer');
  }
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = magnitude / denominator;
  const remainder = magnitude % denominator;
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/** Largest magnitude representable without precision loss in a JS number. */
export const MAX_SAFE_MINOR = Number.MAX_SAFE_INTEGER;

/** Convert an exact BigInt result back to a number, refusing silent precision loss. */
export function toSafeNumber(value: bigint, label = 'value'): number {
  if (value > BigInt(MAX_SAFE_MINOR) || value < -BigInt(MAX_SAFE_MINOR)) {
    throw new DomainError('AMOUNT_OVERFLOW', `${label} exceeds the safe integer range`, {
      value: value.toString(),
    });
  }
  return Number(value);
}
