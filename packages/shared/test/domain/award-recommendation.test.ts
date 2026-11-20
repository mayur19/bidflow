import { describe, expect, it } from 'vitest';
import { assessRecommendation, compareBids } from '../../src/index.js';
import { AC_BIDS, AC_RFQ, AC_SCORES } from './fixtures.js';

describe('assessRecommendation (FR-07, B-10, B-11)', () => {
  const comparison = compareBids(AC_RFQ, AC_BIDS, AC_SCORES);

  it('allows the top-ranked qualified bid without extra justification', () => {
    expect(assessRecommendation(comparison, 'bid-allied')).toEqual({
      eligible: true,
      blockers: [],
      isTopRanked: true,
      requiresJustification: false,
    });
  });

  it('requires justification for a non-top-ranked qualified bid', () => {
    expect(assessRecommendation(comparison, 'bid-peak')).toEqual({
      eligible: true,
      blockers: [],
      isTopRanked: false,
      requiresJustification: true,
    });
  });

  it('blocks the cheapest but technically non-compliant bid', () => {
    expect(assessRecommendation(comparison, 'bid-metro')).toEqual({
      eligible: false,
      blockers: ['TECHNICALLY_NON_COMPLIANT'],
      isTopRanked: false,
      requiresJustification: false,
    });
  });

  it('blocks unknown bids', () => {
    expect(assessRecommendation(comparison, 'bid-ghost').blockers).toEqual(['UNKNOWN_BID']);
  });

  it('blocks recommendations while evaluation is incomplete', () => {
    const provisional = compareBids(AC_RFQ, AC_BIDS, AC_SCORES.slice(1));
    expect(assessRecommendation(provisional, 'bid-allied')).toMatchObject({
      eligible: false,
      blockers: ['EVALUATION_INCOMPLETE'],
      requiresJustification: false,
    });
  });
});
