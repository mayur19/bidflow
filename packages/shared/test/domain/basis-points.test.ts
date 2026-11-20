import { describe, expect, it } from 'vitest';
import {
  applyBasisPoints,
  assertBasisPoints,
  BPS_SCALE,
  formatBasisPoints,
  money,
} from '../../src/index.js';

describe('basis points', () => {
  it('validates ranges', () => {
    expect(BPS_SCALE).toBe(10_000);
    expect(assertBasisPoints(0)).toBe(0);
    expect(assertBasisPoints(10_000)).toBe(10_000);
    expect(() => assertBasisPoints(10_001)).toThrow(/between 0 and 10000/);
    expect(() => assertBasisPoints(-1)).toThrow(/between 0 and 10000/);
    expect(() => assertBasisPoints(12.5)).toThrow(/integer/);
    expect(assertBasisPoints(-5, -10, 10)).toBe(-5);
  });

  it('applies a rate with a single half-up rounding', () => {
    expect(applyBasisPoints(money(4_100_000, 'USD'), 6000)).toEqual(money(2_460_000, 'USD'));
    // 8.25% of USD 0.99 = 0.081675 -> 0.08
    expect(applyBasisPoints(money(99, 'USD'), 825).amountMinor).toBe(8);
    // 50% of 0.01 = 0.005 -> 0.01
    expect(applyBasisPoints(money(1, 'USD'), 5000).amountMinor).toBe(1);
  });

  it('formats as a percentage', () => {
    expect(formatBasisPoints(6000)).toBe('60.00%');
    expect(formatBasisPoints(1250)).toBe('12.50%');
    expect(formatBasisPoints(5)).toBe('0.05%');
    expect(formatBasisPoints(-250)).toBe('-2.50%');
  });
});
