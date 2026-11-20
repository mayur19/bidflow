import { describe, expect, it } from 'vitest';
import {
  assertQuantityMilli,
  DomainError,
  formatQuantity,
  money,
  multiplyByQuantity,
  parseQuantity,
  QUANTITY_SCALE,
} from '../../src/index.js';

describe('quantities', () => {
  it('parses whole and fractional quantities into milli-units', () => {
    expect(QUANTITY_SCALE).toBe(1000);
    expect(parseQuantity('20')).toBe(20_000);
    expect(parseQuantity(' 2.5 ')).toBe(2_500);
    expect(parseQuantity('0.125')).toBe(125);
  });

  it.each(['0', '0.000', '-1', 'abc', '', '1.', '1,000'])('rejects %j', (input) => {
    expect(() => parseQuantity(input)).toThrow(DomainError);
  });

  it('rejects more than three decimals', () => {
    expect(() => parseQuantity('1.0005')).toThrow(/at most 3 decimal/);
  });

  it('formats without trailing zeros', () => {
    expect(formatQuantity(20_000)).toBe('20');
    expect(formatQuantity(2_500)).toBe('2.5');
    expect(formatQuantity(125)).toBe('0.125');
    expect(formatQuantity(1_010)).toBe('1.01');
  });

  it('asserts positive safe integers', () => {
    expect(assertQuantityMilli(1)).toBe(1);
    expect(() => assertQuantityMilli(0)).toThrow(/positive/);
    expect(() => assertQuantityMilli(1.5)).toThrow(/positive/);
    expect(() => formatQuantity(-1)).toThrow(DomainError);
  });
});

describe('multiplyByQuantity (unit price × quantity)', () => {
  it('multiplies whole quantities exactly', () => {
    expect(multiplyByQuantity(money(185_000, 'USD'), 20_000)).toEqual(money(3_700_000, 'USD'));
  });

  it('handles fractional quantities with one final rounding (half up)', () => {
    expect(multiplyByQuantity(money(1850, 'USD'), 2_500).amountMinor).toBe(4625);
    // 0.333 × 1.01 = 0.33633 -> 0.34
    expect(multiplyByQuantity(money(101, 'USD'), 333).amountMinor).toBe(34);
    // 0.5 × 0.01 = 0.005 -> 0.01 (half up)
    expect(multiplyByQuantity(money(1, 'USD'), 500).amountMinor).toBe(1);
    // 0.499 × 0.01 = 0.00499 -> 0.00
    expect(multiplyByQuantity(money(1, 'USD'), 499).amountMinor).toBe(0);
  });

  it('computes products beyond 2^53 exactly before the overflow guard', () => {
    const big = money(9_000_000_000_000, 'USD');
    expect(multiplyByQuantity(big, 1_000).amountMinor).toBe(9_000_000_000_000);
    expect(() => multiplyByQuantity(big, 2_000_000)).toThrow(/line total exceeds/);
  });

  it('rejects negative prices and invalid quantities', () => {
    expect(() => multiplyByQuantity(money(-1, 'USD'), 1000)).toThrow(/cannot be negative/);
    expect(() => multiplyByQuantity(money(1, 'USD'), 0)).toThrow(/positive/);
  });
});
