import { DomainError } from './errors.js';
import { type Money, scaleMoney } from './money.js';

/** 1 basis point = 0.01 %. 10_000 bps = 100 %. */
export const BPS_SCALE = 10_000;

export function assertBasisPoints(value: number, min = 0, max = BPS_SCALE): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new DomainError('INVALID_RATE', `Rate must be an integer between ${min} and ${max} bps`);
  }
  return value;
}

/** amount × bps / 10 000, rounded once (ROUND HALF UP). */
export function applyBasisPoints(amount: Money, bps: number): Money {
  return scaleMoney(amount, BigInt(assertBasisPoints(bps)), BigInt(BPS_SCALE));
}

/** 6000 -> "60.00%", 1250 -> "12.50%". */
export function formatBasisPoints(bps: number): string {
  const value = assertBasisPoints(bps, -BPS_SCALE * 100, BPS_SCALE * 100);
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(value).toString().padStart(3, '0');
  return `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}%`;
}
