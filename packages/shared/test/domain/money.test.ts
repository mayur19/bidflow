import { describe, expect, it } from 'vitest';
import {
  addMoney,
  assertCurrency,
  assertMinorUnits,
  compareMoney,
  currencyExponent,
  DomainError,
  isDomainError,
  isPositive,
  minorFactor,
  money,
  parseMinorUnits,
  scaleMoney,
  subtractMoney,
  sumMoney,
  zeroMoney,
} from '../../src/index.js';

const usd = (minor: number) => money(minor, 'USD');

describe('currency', () => {
  it('accepts upper-case three-letter codes', () => {
    expect(assertCurrency('USD')).toBe('USD');
  });

  it.each(['usd', 'US', 'USDX', '', '12A'])('rejects %j', (code) => {
    expect(() => assertCurrency(code)).toThrow(DomainError);
  });

  it('knows minor-unit exponents', () => {
    expect(currencyExponent('USD')).toBe(2);
    expect(currencyExponent('EUR')).toBe(2);
    expect(currencyExponent('JPY')).toBe(0);
    expect(currencyExponent('KWD')).toBe(3);
    expect(minorFactor('USD')).toBe(100n);
    expect(minorFactor('JPY')).toBe(1n);
  });
});

describe('money construction', () => {
  it('creates frozen values', () => {
    const value = usd(4_100_000);
    expect(value).toEqual({ amountMinor: 4_100_000, currency: 'USD' });
    expect(Object.isFrozen(value)).toBe(true);
    expect(zeroMoney('EUR')).toEqual({ amountMinor: 0, currency: 'EUR' });
  });

  it('rejects fractional minor units', () => {
    expect(() => usd(10.5)).toThrow(/integer number of minor units/);
    expect(() => assertMinorUnits(Number.NaN)).toThrow(DomainError);
  });

  it('rejects unsafe magnitudes', () => {
    expect(() => usd(Number.MAX_SAFE_INTEGER + 1)).toThrow(/safe integer range/);
    expect(() => usd(-(Number.MAX_SAFE_INTEGER + 1))).toThrow(/safe integer range/);
    expect(usd(Number.MAX_SAFE_INTEGER).amountMinor).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('money arithmetic', () => {
  it('adds and subtracts in the same currency without mutating inputs', () => {
    const a = usd(1050);
    const b = usd(250);
    expect(addMoney(a, b)).toEqual(usd(1300));
    expect(subtractMoney(b, a)).toEqual(usd(-800));
    expect(a.amountMinor).toBe(1050);
  });

  it('refuses to mix currencies', () => {
    const error = (() => {
      try {
        addMoney(usd(1), money(1, 'EUR'));
      } catch (e) {
        return e;
      }
      return null;
    })();
    expect(isDomainError(error)).toBe(true);
    expect((error as DomainError).code).toBe('CURRENCY_MISMATCH');
    expect(() => subtractMoney(usd(1), money(1, 'EUR'))).toThrow(/Cannot combine/);
    expect(() => compareMoney(usd(1), money(1, 'EUR'))).toThrow(DomainError);
  });

  it('guards against overflow on addition and subtraction', () => {
    const max = usd(Number.MAX_SAFE_INTEGER);
    expect(() => addMoney(max, usd(1))).toThrow(/sum exceeds/);
    expect(() => subtractMoney(usd(-Number.MAX_SAFE_INTEGER), usd(1))).toThrow(/difference/);
  });

  it('sums lists, returning zero for an empty list', () => {
    expect(sumMoney([usd(1), usd(2), usd(3)], 'USD')).toEqual(usd(6));
    expect(sumMoney([], 'USD')).toEqual(usd(0));
  });

  it('compares amounts', () => {
    expect(compareMoney(usd(1), usd(2))).toBe(-1);
    expect(compareMoney(usd(2), usd(2))).toBe(0);
    expect(compareMoney(usd(3), usd(2))).toBe(1);
    expect(isPositive(usd(1))).toBe(true);
    expect(isPositive(usd(0))).toBe(false);
  });

  it('scales by an integer ratio rounding half up once', () => {
    expect(scaleMoney(usd(100), 1n, 3n)).toEqual(usd(33));
    expect(scaleMoney(usd(5), 1n, 2n)).toEqual(usd(3));
    expect(scaleMoney(usd(-5), 1n, 2n)).toEqual(usd(-3));
    expect(() => scaleMoney(usd(Number.MAX_SAFE_INTEGER), 2n, 1n)).toThrow(/scaled amount/);
  });
});

describe('parseMinorUnits', () => {
  it('parses PostgreSQL bigint strings and safe numbers', () => {
    expect(parseMinorUnits('4140000')).toBe(4_140_000);
    expect(parseMinorUnits('-15')).toBe(-15);
    expect(parseMinorUnits(42)).toBe(42);
  });

  it.each(['12.5', '1e5', '', ' 1', 'abc', '99999999999999999'])('rejects %j', (value) => {
    expect(() => parseMinorUnits(value)).toThrow(DomainError);
  });

  it('rejects 16-digit values beyond the safe range', () => {
    expect(() => parseMinorUnits('9999999999999999')).toThrow(/safe integer range/);
  });
});
