import type { BidComparison, IneligibilityReason } from './bid-types.js';

export type RecommendationBlocker = IneligibilityReason | 'UNKNOWN_BID' | 'EVALUATION_INCOMPLETE';

export interface RecommendationAssessment {
  readonly eligible: boolean;
  readonly blockers: readonly RecommendationBlocker[];
  readonly isTopRanked: boolean;
  /** B-11: recommending a non-top-ranked bid needs justification + finance approval. */
  readonly requiresJustification: boolean;
}

/**
 * Check whether a bid may be recommended for award (FR-07). Unqualified
 * bids can never be recommended; disqualification must first be cleared.
 */
export function assessRecommendation(
  comparison: BidComparison,
  bidId: string,
): RecommendationAssessment {
  const row = comparison.rows.find((candidate) => candidate.bidId === bidId);
  if (!row) {
    return {
      eligible: false,
      blockers: ['UNKNOWN_BID'],
      isTopRanked: false,
      requiresJustification: false,
    };
  }
  const blockers: RecommendationBlocker[] = [
    ...row.ineligibilityReasons,
    ...(comparison.provisional ? (['EVALUATION_INCOMPLETE'] as const) : []),
  ];
  const eligible = blockers.length === 0;
  const isTopRanked = row.rank === 1;
  return { eligible, blockers, isTopRanked, requiresJustification: eligible && !isTopRanked };
}
