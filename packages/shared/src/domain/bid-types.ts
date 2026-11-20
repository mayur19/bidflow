import type { EvaluationCriterion } from './evaluation-criteria.js';

/** Input contracts for the comparison engine (FR-06). All money in minor units. */
export interface RfqLineInput {
  readonly id: string;
  readonly description: string;
  readonly quantityMilli: number;
}

export interface ComparisonRfq {
  readonly currency: string;
  readonly lines: readonly RfqLineInput[];
  readonly criteria: readonly EvaluationCriterion[];
}

export interface BidLineInput {
  readonly rfqLineId: string;
  readonly unitPriceMinor: number;
  readonly leadDays: number;
  /** Supplier/evaluator confirmation that the line meets the technical spec. */
  readonly compliant: boolean;
}

/** Draft bids are sealed and must never be passed to the engine. */
export type ComparableBidStatus = 'SUBMITTED' | 'WITHDRAWN';

export interface BidInput {
  readonly bidId: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly currency: string;
  readonly status: ComparableBidStatus;
  /** ISO-8601 timestamp of the current submitted revision (UTC). */
  readonly submittedAt: string;
  readonly lines: readonly BidLineInput[];
  /** Present when an evaluator disqualified the bid (bid_qualifications). */
  readonly disqualificationReason?: string | null;
}

export interface ScoreInput {
  readonly bidId: string;
  readonly criterionId: string;
  readonly evaluatorId: string;
  /** Integer 0–100 entered by a buyer evaluator. */
  readonly score: number;
}

export type IneligibilityReason =
  | 'WITHDRAWN'
  | 'DISQUALIFIED'
  | 'TECHNICALLY_NON_COMPLIANT'
  | 'CURRENCY_MISMATCH'
  | 'INCOMPLETE'
  | 'NON_POSITIVE_TOTAL';

export interface LineResult {
  readonly rfqLineId: string;
  readonly quantityMilli: number;
  readonly unitPriceMinor: number;
  readonly lineTotalMinor: number;
  readonly leadDays: number;
  readonly compliant: boolean;
}

export interface CriterionPoints {
  readonly criterionId: string;
  readonly kind: EvaluationCriterion['kind'];
  readonly weightBps: number;
  readonly evaluatorCount: number;
  /** Points in parts-per-million of the 100-point scale; null when not scored. */
  readonly pointsPpm: number | null;
}

export interface BidComparisonRow {
  readonly bidId: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly status: ComparableBidStatus;
  readonly submittedAt: string;
  readonly lines: readonly LineResult[];
  readonly totalMinor: number | null;
  readonly maxLeadDays: number | null;
  readonly qualified: boolean;
  readonly ineligibilityReasons: readonly IneligibilityReason[];
  readonly criteria: readonly CriterionPoints[];
  readonly missingCriterionIds: readonly string[];
  readonly totalScorePpm: number | null;
  readonly rank: number | null;
  readonly isLowestPriced: boolean;
  readonly isLowestQualified: boolean;
}

export interface BidComparison {
  readonly currency: string;
  /** Ranked qualified bids first (rank 1..n), then unranked bids by price. */
  readonly rows: readonly BidComparisonRow[];
  readonly lowestPricedBidId: string | null;
  readonly lowestQualifiedBidId: string | null;
  readonly lowestQualifiedTotalMinor: number | null;
  /** True while any qualified bid lacks a score for a qualitative criterion. */
  readonly provisional: boolean;
}
