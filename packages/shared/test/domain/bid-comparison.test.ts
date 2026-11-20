import { describe, expect, it } from 'vitest';
import {
  compareBids,
  computeBidTotals,
  DomainError,
  type BidInput,
  type ComparisonRfq,
} from '../../src/index.js';
import { AC_BIDS, AC_RFQ, AC_SCORES, ALLIED, makeScore, METRO, PEAK } from './fixtures.js';

describe('PRD §8: cheapest bid is technically unqualified', () => {
  const result = compareBids(AC_RFQ, AC_BIDS, AC_SCORES);
  const row = (id: string) => result.rows.find((r) => r.bidId === id)!;

  it('computes line totals and bid totals in minor units', () => {
    expect(row('bid-peak').lines.map((l) => l.lineTotalMinor)).toEqual([3_700_000, 440_000]);
    expect(row('bid-peak').totalMinor).toBe(4_140_000);
    expect(row('bid-allied').totalMinor).toBe(4_100_000);
    expect(row('bid-metro').totalMinor).toBe(3_740_000);
    expect(row('bid-allied').maxLeadDays).toBe(14);
  });

  it('distinguishes the lowest-priced bid from the lowest qualified bid', () => {
    expect(result.lowestPricedBidId).toBe('bid-metro');
    expect(result.lowestQualifiedBidId).toBe('bid-allied');
    expect(result.lowestQualifiedTotalMinor).toBe(4_100_000);
    expect(row('bid-metro').isLowestPriced).toBe(true);
    expect(row('bid-metro').isLowestQualified).toBe(false);
    expect(row('bid-allied').isLowestQualified).toBe(true);
  });

  it('still shows the non-compliant bid but excludes it from scoring and ranking', () => {
    const metro = row('bid-metro');
    expect(metro.qualified).toBe(false);
    expect(metro.ineligibilityReasons).toEqual(['TECHNICALLY_NON_COMPLIANT']);
    expect(metro.totalScorePpm).toBeNull();
    expect(metro.rank).toBeNull();
    expect(metro.criteria[0]!.pointsPpm).toBeNull();
    expect(metro.criteria[1]!.pointsPpm).toBe(150_000);
  });

  it('normalizes price against the lowest qualified total and weights scores', () => {
    expect(row('bid-allied').criteria.map((c) => c.pointsPpm)).toEqual([600_000, 187_500, 142_500]);
    expect(row('bid-allied').totalScorePpm).toBe(930_000);
    expect(row('bid-peak').criteria.map((c) => c.pointsPpm)).toEqual([594_203, 225_000, 105_000]);
    expect(row('bid-peak').totalScorePpm).toBe(924_203);
  });

  it('ranks qualified bids first, then lists unqualified bids', () => {
    expect(result.rows.map((r) => [r.bidId, r.rank])).toEqual([
      ['bid-allied', 1],
      ['bid-peak', 2],
      ['bid-metro', null],
    ]);
    expect(result.provisional).toBe(false);
    expect(result.currency).toBe('USD');
  });

  it('is deterministic regardless of input order', () => {
    const reversed = compareBids(AC_RFQ, [...AC_BIDS].reverse(), [...AC_SCORES].reverse());
    expect(reversed).toEqual(result);
  });
});

const SIMPLE: ComparisonRfq = {
  currency: 'USD',
  lines: [{ id: 'l1', description: 'Widget', quantityMilli: 1000 }],
  criteria: [
    { id: 'price', label: 'Price', kind: 'PRICE', weightBps: 5000 },
    { id: 'quality', label: 'Quality', kind: 'QUALITATIVE', weightBps: 5000 },
  ],
};

function simpleBid(
  bidId: string,
  price: number,
  overrides: Partial<BidInput> = {},
  leadDays = 10,
): BidInput {
  return {
    bidId,
    supplierId: `s-${bidId}`,
    supplierName: bidId.toUpperCase(),
    currency: 'USD',
    status: 'SUBMITTED',
    submittedAt: '2026-11-10T09:00:00Z',
    lines: [{ rfqLineId: 'l1', unitPriceMinor: price, leadDays, compliant: true }],
    ...overrides,
  };
}

const ranks = (
  rfq: ComparisonRfq,
  bids: BidInput[],
  scores = bids.map((b) => makeScore(b.bidId, 'quality', 50)),
) => compareBids(rfq, bids, scores).rows.map((r) => r.bidId);

describe('deterministic tie-breaking', () => {
  it('equal score: lower total price wins', () => {
    // a: 100% price (500000) + 0 quality; b: 50% price (250000) + 50 quality (250000)
    const a = simpleBid('a', 100);
    const b = simpleBid('b', 200);
    const result = compareBids(
      SIMPLE,
      [b, a],
      [makeScore('a', 'quality', 0), makeScore('b', 'quality', 50)],
    );
    expect(result.rows.map((r) => r.totalScorePpm)).toEqual([500_000, 500_000]);
    expect(result.rows.map((r) => r.bidId)).toEqual(['a', 'b']);
  });

  it('equal score and price: shorter lead time wins', () => {
    expect(ranks(SIMPLE, [simpleBid('a', 100, {}, 20), simpleBid('b', 100, {}, 5)])).toEqual([
      'b',
      'a',
    ]);
  });

  it('equal score, price and lead time: earlier submission wins', () => {
    const early = simpleBid('z', 100, { submittedAt: '2026-11-10T08:00:00Z' });
    const late = simpleBid('a', 100, { submittedAt: '2026-11-10T08:00:01Z' });
    expect(ranks(SIMPLE, [late, early])).toEqual(['z', 'a']);
  });

  it('identical bids: bid id decides', () => {
    expect(ranks(SIMPLE, [simpleBid('b', 100), simpleBid('a', 100)])).toEqual(['a', 'b']);
  });

  it('lowest-priced tie goes to the earlier submission, then bid id', () => {
    const first = simpleBid('b', 100, { submittedAt: '2026-11-09T00:00:00Z' });
    const second = simpleBid('a', 100);
    expect(compareBids(SIMPLE, [second, first], []).lowestPricedBidId).toBe('b');
    expect(
      compareBids(SIMPLE, [simpleBid('b', 100), simpleBid('a', 100)], []).lowestPricedBidId,
    ).toBe('a');
  });
});

describe('eligibility rules', () => {
  it('B-10: a disqualified cheapest bid is excluded from price normalization', () => {
    const cheap = simpleBid('cheap', 80, { disqualificationReason: 'Expired certification' });
    const next = simpleBid('next', 100);
    const result = compareBids(SIMPLE, [cheap, next], [makeScore('next', 'quality', 100)]);
    expect(result.lowestPricedBidId).toBe('cheap');
    expect(result.lowestQualifiedBidId).toBe('next');
    expect(result.rows[0]).toMatchObject({ bidId: 'next', rank: 1, totalScorePpm: 1_000_000 });
    expect(result.rows[1]).toMatchObject({
      bidId: 'cheap',
      rank: null,
      ineligibilityReasons: ['DISQUALIFIED'],
    });
  });

  it('withdrawn bids are shown, never ranked and never lowest-priced', () => {
    const result = compareBids(
      SIMPLE,
      [simpleBid('w', 50, { status: 'WITHDRAWN' }), simpleBid('ok', 100)],
      [],
    );
    expect(result.lowestPricedBidId).toBe('ok');
    expect(result.rows.find((r) => r.bidId === 'w')!.ineligibilityReasons).toEqual(['WITHDRAWN']);
  });

  it('rejects cross-currency bids without converting them', () => {
    const eur = simpleBid('eur', 10, { currency: 'EUR' });
    const row = compareBids(SIMPLE, [eur], []).rows[0]!;
    expect(row.ineligibilityReasons).toEqual(['CURRENCY_MISMATCH']);
    expect(row.totalMinor).toBeNull();
    expect(row.maxLeadDays).toBe(10);
  });

  it('marks bids missing an RFQ line as incomplete', () => {
    const rfq: ComparisonRfq = {
      ...SIMPLE,
      lines: [...SIMPLE.lines, { id: 'l2', description: 'Extra', quantityMilli: 500 }],
    };
    const totals = computeBidTotals(simpleBid('x', 100), rfq.lines, 'USD');
    expect(totals).toMatchObject({ totalMinor: null, maxLeadDays: null, reasons: ['INCOMPLETE'] });
    expect(totals.lines).toHaveLength(1);
  });

  it('marks zero-priced bids as ineligible and not lowest-priced', () => {
    const result = compareBids(SIMPLE, [simpleBid('free', 0)], []);
    expect(result.rows[0]!.ineligibilityReasons).toEqual(['NON_POSITIVE_TOTAL']);
    expect(result.lowestPricedBidId).toBeNull();
  });

  it('collects several reasons at once', () => {
    const bad = simpleBid('bad', 10, {
      status: 'WITHDRAWN',
      disqualificationReason: 'x',
      lines: [{ rfqLineId: 'l1', unitPriceMinor: 10, leadDays: 1, compliant: false }],
    });
    expect(compareBids(SIMPLE, [bad], []).rows[0]!.ineligibilityReasons).toEqual([
      'WITHDRAWN',
      'DISQUALIFIED',
      'TECHNICALLY_NON_COMPLIANT',
    ]);
  });

  it('orders unranked bids by total, unpriced last, then bid id', () => {
    const result = compareBids(
      SIMPLE,
      [
        simpleBid('c', 10, { currency: 'EUR' }),
        simpleBid('b', 30, { status: 'WITHDRAWN' }),
        simpleBid('a', 20, { status: 'WITHDRAWN' }),
        simpleBid('d', 10, { currency: 'EUR' }),
      ],
      [],
    );
    expect(result.rows.map((r) => r.bidId)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.lowestQualifiedBidId).toBeNull();
    expect(result.lowestQualifiedTotalMinor).toBeNull();
  });
});

describe('evaluation completeness', () => {
  it('is provisional while a qualified bid lacks a qualitative score', () => {
    const result = compareBids(
      AC_RFQ,
      [PEAK, ALLIED],
      AC_SCORES.filter(
        (s) => s.bidId !== 'bid-metro' && !(s.criterionId === 'delivery' && s.bidId === 'bid-peak'),
      ),
    );
    expect(result.provisional).toBe(true);
    const peak = result.rows.find((r) => r.bidId === 'bid-peak')!;
    expect(peak.missingCriterionIds).toEqual(['delivery']);
    expect(peak.totalScorePpm).toBe(594_203 + 225_000);
  });

  it('ignores missing scores on unqualified bids', () => {
    const scores = AC_SCORES.filter((s) => s.bidId !== 'bid-metro');
    expect(compareBids(AC_RFQ, AC_BIDS, scores).provisional).toBe(false);
  });

  it('handles an RFQ with no bids', () => {
    expect(compareBids(AC_RFQ, [], [])).toEqual({
      currency: 'USD',
      rows: [],
      lowestPricedBidId: null,
      lowestQualifiedBidId: null,
      lowestQualifiedTotalMinor: null,
      provisional: false,
    });
  });
});

describe('input validation', () => {
  const expectDomain = (fn: () => unknown, code: string) => {
    try {
      fn();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(code);
    }
  };

  it('rejects invalid criteria, empty lines, bad quantities and currencies', () => {
    expectDomain(
      () => compareBids({ ...SIMPLE, criteria: SIMPLE.criteria.slice(0, 1) }, [], []),
      'INVALID_CRITERIA',
    );
    expectDomain(() => compareBids({ ...SIMPLE, lines: [] }, [], []), 'INVALID_BID');
    expectDomain(
      () =>
        compareBids(
          { ...SIMPLE, lines: [{ id: 'l1', description: 'x', quantityMilli: 0 }] },
          [],
          [],
        ),
      'INVALID_QUANTITY',
    );
    expectDomain(() => compareBids({ ...SIMPLE, currency: 'usd' }, [], []), 'INVALID_CURRENCY');
  });

  it('rejects unknown or duplicate bid lines and negative lead times', () => {
    const line = { rfqLineId: 'l1', unitPriceMinor: 1, leadDays: 1, compliant: true };
    expectDomain(
      () => compareBids(SIMPLE, [simpleBid('x', 1, { lines: [{ ...line, rfqLineId: 'zz' }] })], []),
      'INVALID_BID',
    );
    expectDomain(
      () => compareBids(SIMPLE, [simpleBid('x', 1, { lines: [line, line] })], []),
      'INVALID_BID',
    );
    expectDomain(() => compareBids(SIMPLE, [simpleBid('x', 1, {}, -1)], []), 'INVALID_BID');
    expectDomain(() => compareBids(SIMPLE, [simpleBid('x', 1, {}, 1.5)], []), 'INVALID_BID');
  });

  it('rejects negative prices, invalid timestamps and invalid scores', () => {
    expectDomain(() => compareBids(SIMPLE, [simpleBid('x', -1)], []), 'INVALID_AMOUNT');
    expectDomain(
      () => compareBids(SIMPLE, [simpleBid('x', 1, { submittedAt: 'yesterday' })], []),
      'INVALID_BID',
    );
    expectDomain(
      () => compareBids(SIMPLE, [simpleBid('x', 1)], [makeScore('x', 'quality', 101)]),
      'INVALID_SCORE',
    );
  });

  it('keeps inputs untouched', () => {
    const bids = [METRO, PEAK];
    const snapshot = JSON.stringify(bids);
    compareBids(AC_RFQ, bids, []);
    expect(JSON.stringify(bids)).toBe(snapshot);
  });
});
