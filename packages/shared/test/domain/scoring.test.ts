import { describe, expect, it } from 'vitest';
import {
  assertScores,
  formatScore,
  pricePointsPpm,
  qualitativeCriteriaPoints,
  qualitativePointsPpm,
  SCORE_SCALE_PPM,
} from '../../src/index.js';
import { AC_BIDS, AC_RFQ, makeScore } from './fixtures.js';

describe('pricePointsPpm (FR-06 formula)', () => {
  it('gives the lowest qualified bid the full price weight', () => {
    expect(pricePointsPpm(4_100_000, 4_100_000, 6000)).toBe(600_000);
    expect(pricePointsPpm(1, 1, 10_000)).toBe(SCORE_SCALE_PPM);
  });

  it('scales other bids by lowest / this, rounded half up to 1 ppm', () => {
    // 41,000 / 41,400 × 60 = 59.42028985... points
    expect(pricePointsPpm(4_100_000, 4_140_000, 6000)).toBe(594_203);
    // 1/3 × 100 points = 333333.33 ppm -> 333333
    expect(pricePointsPpm(1, 3, 10_000)).toBe(333_333);
    // 2/3 × 100 points = 666666.67 ppm -> 666667
    expect(pricePointsPpm(2, 3, 10_000)).toBe(666_667);
  });

  it('rejects non-positive or inconsistent totals', () => {
    expect(() => pricePointsPpm(0, 10, 6000)).toThrow(/positive totals/);
    expect(() => pricePointsPpm(10, 5, 6000)).toThrow(/positive totals/);
  });
});

describe('qualitativePointsPpm', () => {
  it('multiplies the mean score by the weight', () => {
    expect(qualitativePointsPpm([90], 2500)).toBe(225_000);
    expect(qualitativePointsPpm([100], 10_000)).toBe(SCORE_SCALE_PPM);
    // mean of 70 and 71 = 70.5 → 70.5 × 1500 = 105750
    expect(qualitativePointsPpm([70, 71], 1500)).toBe(105_750);
    // (1 + 0 + 0)/3 × 1 = 0.333 -> 0 ; (2+0+0)/3 × 1 = 0.667 -> 1
    expect(qualitativePointsPpm([1, 0, 0], 1)).toBe(0);
    expect(qualitativePointsPpm([2, 0, 0], 1)).toBe(1);
  });

  it('returns null when nobody has scored yet', () => {
    expect(qualitativePointsPpm([], 2500)).toBeNull();
  });
});

describe('formatScore', () => {
  it.each([
    [924_203, '92.42'],
    [930_000, '93.00'],
    [5_000, '0.50'],
    [4_999, '0.50'],
    [4_949, '0.49'],
    [0, '0.00'],
    [1_000_000, '100.00'],
  ])('%i ppm -> %s', (ppm, expected) => {
    expect(formatScore(ppm)).toBe(expected);
  });
});

describe('assertScores', () => {
  it('accepts valid scores', () => {
    expect(() =>
      assertScores(
        [makeScore('bid-peak', 'quality', 0), makeScore('bid-peak', 'delivery', 100)],
        AC_BIDS,
        AC_RFQ.criteria,
      ),
    ).not.toThrow();
  });

  it.each([
    ['above 100', makeScore('bid-peak', 'quality', 101), /whole numbers from 0 to 100/],
    ['negative', makeScore('bid-peak', 'quality', -1), /whole numbers/],
    ['fractional', makeScore('bid-peak', 'quality', 50.5), /whole numbers/],
    ['unknown bid', makeScore('bid-ghost', 'quality', 50), /unknown bid/],
    ['price criterion', makeScore('bid-peak', 'price', 50), /non-price criteria/],
    ['unknown criterion', makeScore('bid-peak', 'nope', 50), /non-price criteria/],
  ])('rejects %s', (_label, score, message) => {
    expect(() => assertScores([score], AC_BIDS, AC_RFQ.criteria)).toThrow(message);
  });

  it('rejects duplicate evaluator scores but allows multiple evaluators', () => {
    const one = makeScore('bid-peak', 'quality', 80, 'e1');
    const two = makeScore('bid-peak', 'quality', 70, 'e2');
    expect(() => assertScores([one, two], AC_BIDS, AC_RFQ.criteria)).not.toThrow();
    expect(() => assertScores([one, { ...one }], AC_BIDS, AC_RFQ.criteria)).toThrow(/Duplicate/);
  });
});

describe('qualitativeCriteriaPoints', () => {
  it('returns one entry per qualitative criterion with evaluator counts', () => {
    const points = qualitativeCriteriaPoints('bid-peak', AC_RFQ.criteria, [
      makeScore('bid-peak', 'quality', 80, 'e1'),
      makeScore('bid-peak', 'quality', 100, 'e2'),
      makeScore('bid-allied', 'delivery', 10),
    ]);
    expect(points).toEqual([
      {
        criterionId: 'quality',
        kind: 'QUALITATIVE',
        weightBps: 2500,
        evaluatorCount: 2,
        pointsPpm: 225_000,
      },
      {
        criterionId: 'delivery',
        kind: 'QUALITATIVE',
        weightBps: 1500,
        evaluatorCount: 0,
        pointsPpm: null,
      },
    ]);
  });
});
