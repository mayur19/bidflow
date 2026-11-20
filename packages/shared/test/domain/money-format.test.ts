import { describe, expect, it } from 'vitest';
import {
  DomainError,
  formatMinorUnits,
  formatMoney,
  money,
  parseMajorUnits,
} from '../../src/index.js';

describe('formatMoney', () => {
  it.each([
    [4_100_000, 'USD', 'USD 41,000.00'],
    [5, 'USD', 'USD 0.05'],
    [0, 'USD', 'USD 0.00'],
    [-123_456, 'USD', 'USD -1,234.56'],
    [1_234_567, 'JPY', 'JPY 1,234,567'],
    [1_234_567, 'KWD', 'KWD 1,234.567'],
    [100, 'EUR', 'EUR 1.00'],
  ])('%i %s -> %s', (minor, currency, expected) => {
    expect(formatMoney(money(minor, currency))).toBe(expected);
  });
});

describe('formatMinorUnits', () => {
  it('renders plain decimals for inputs and CSV', () => {
    expect(formatMinorUnits(1_250_050, 'USD')).toBe('12500.50');
    expect(formatMinorUnits(-7, 'USD')).toBe('-0.07');
    expect(formatMinorUnits(900, 'JPY')).toBe('900');
  });

  it('rejects non-integer input', () => {
    expect(() => formatMinorUnits(1.5, 'USD')).toThrow(DomainError);
  });
});

describe('parseMajorUnits', () => {
  it.each([
    ['12500', 'USD', 1_250_000],
    ['12,500.5', 'USD', 1_250_050],
    ['  0.07 ', 'USD', 7],
    ['1,234,567', 'JPY', 1_234_567],
    ['1.234', 'KWD', 1234],
    ['0', 'USD', 0],
  ])('%j %s -> %i', (input, currency, expected) => {
    expect(parseMajorUnits(input, currency)).toBe(expected);
  });

  it.each(['', '-5', 'abc', '1,23', '12.', '1e3', '12,50.00'])('rejects %j', (input) => {
    expect(() => parseMajorUnits(input, 'USD')).toThrow(/non-negative amount/);
  });

  it('refuses to silently round extra decimals', () => {
    expect(() => parseMajorUnits('1.005', 'USD')).toThrow(/at most 2 decimal places/);
    expect(() => parseMajorUnits('1.5', 'JPY')).toThrow(/at most 0 decimal places/);
  });

  it('guards against overflow', () => {
    expect(() => parseMajorUnits('99999999999999999', 'USD')).toThrow(/safe integer range/);
  });
});
