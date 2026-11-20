import { describe, expect, it } from 'vitest';
import { divideRoundHalfUp, toSafeNumber } from '../../src/index.js';

describe('divideRoundHalfUp (the one rounding rule)', () => {
  it.each([
    [5n, 2n, 3n],
    [7n, 2n, 4n],
    [7n, 3n, 2n],
    [8n, 3n, 3n],
    [-5n, 2n, -3n],
    [-7n, 3n, -2n],
    [-8n, 3n, -3n],
    [0n, 9n, 0n],
    [10n, 5n, 2n],
  ])('%s / %s = %s', (numerator, denominator, expected) => {
    expect(divideRoundHalfUp(numerator, denominator)).toBe(expected);
  });

  it('rejects zero and negative denominators', () => {
    expect(() => divideRoundHalfUp(1n, 0n)).toThrow(/positive integer/);
    expect(() => divideRoundHalfUp(1n, -2n)).toThrow(/positive integer/);
  });
});

describe('toSafeNumber', () => {
  it('converts safe values', () => {
    expect(toSafeNumber(123n)).toBe(123);
    expect(toSafeNumber(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    expect(toSafeNumber(-BigInt(Number.MAX_SAFE_INTEGER))).toBe(-Number.MAX_SAFE_INTEGER);
  });

  it('throws AMOUNT_OVERFLOW outside the safe range', () => {
    expect(() => toSafeNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n, 'total')).toThrow(
      /total exceeds/,
    );
    expect(() => toSafeNumber(-BigInt(Number.MAX_SAFE_INTEGER) - 1n)).toThrow(/value exceeds/);
  });
});
