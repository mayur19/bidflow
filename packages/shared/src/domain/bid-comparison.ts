import type {
  BidComparison,
  BidComparisonRow,
  BidInput,
  ComparisonRfq,
  CriterionPoints,
  ScoreInput,
} from './bid-types.js';
import { computeBidTotals, type BidTotals } from './bid-totals.js';
import { assertCurrency } from './currency.js';
import { DomainError } from './errors.js';
import { assertValidCriteria, type EvaluationCriterion } from './evaluation-criteria.js';
import { assertQuantityMilli } from './quantity.js';
import { assertScores, pricePointsPpm, qualitativeCriteriaPoints } from './scoring.js';

interface Evaluated {
  readonly bid: BidInput;
  readonly totals: BidTotals;
  readonly submittedAtMs: number;
}

function parseSubmittedAt(bid: BidInput): number {
  const ms = Date.parse(bid.submittedAt);
  if (Number.isNaN(ms)) {
    throw new DomainError('INVALID_BID', `Bid ${bid.bidId} has an invalid submission timestamp`);
  }
  return ms;
}

/** Cheapest first; ties by earlier submission, then bid id (fully deterministic). */
function byPrice(a: Evaluated, b: Evaluated): number {
  return (
    a.totals.totalMinor! - b.totals.totalMinor! ||
    a.submittedAtMs - b.submittedAtMs ||
    a.bid.bidId.localeCompare(b.bid.bidId, 'en')
  );
}

function cheapest(candidates: readonly Evaluated[]): Evaluated | null {
  return [...candidates].sort(byPrice)[0] ?? null;
}

function priceCriterion(criteria: readonly EvaluationCriterion[]): EvaluationCriterion {
  return criteria.find((c) => c.kind === 'PRICE')!;
}

function scoreRow(
  item: Evaluated,
  rfq: ComparisonRfq,
  scores: readonly ScoreInput[],
  lowestQualifiedTotal: number | null,
) {
  const price = priceCriterion(rfq.criteria);
  const qualified = item.totals.reasons.length === 0;
  const pricePoints: CriterionPoints = {
    criterionId: price.id,
    kind: 'PRICE',
    weightBps: price.weightBps,
    evaluatorCount: 0,
    pointsPpm:
      qualified && lowestQualifiedTotal !== null
        ? pricePointsPpm(lowestQualifiedTotal, item.totals.totalMinor!, price.weightBps)
        : null,
  };
  const qualitative = qualitativeCriteriaPoints(item.bid.bidId, rfq.criteria, scores);
  const missing = qualitative.filter((c) => c.pointsPpm === null).map((c) => c.criterionId);
  const total = [pricePoints, ...qualitative].reduce((sum, c) => sum + (c.pointsPpm ?? 0), 0);
  return {
    qualified,
    criteria: [pricePoints, ...qualitative],
    missing,
    totalScorePpm: qualified ? total : null,
  };
}

type Scored = Evaluated & { readonly scored: ReturnType<typeof scoreRow> };

/** Highest score; ties by lower price, shorter lead time, earlier submission, bid id. */
function byRank(a: Scored, b: Scored): number {
  return (
    b.scored.totalScorePpm! - a.scored.totalScorePpm! ||
    a.totals.totalMinor! - b.totals.totalMinor! ||
    a.totals.maxLeadDays! - b.totals.maxLeadDays! ||
    a.submittedAtMs - b.submittedAtMs ||
    a.bid.bidId.localeCompare(b.bid.bidId, 'en')
  );
}

function byUnrankedOrder(a: Scored, b: Scored): number {
  const ta = a.totals.totalMinor ?? Number.MAX_SAFE_INTEGER;
  const tb = b.totals.totalMinor ?? Number.MAX_SAFE_INTEGER;
  return ta - tb || a.bid.bidId.localeCompare(b.bid.bidId, 'en');
}

function assertRfq(rfq: ComparisonRfq): void {
  assertCurrency(rfq.currency);
  if (rfq.lines.length === 0) {
    throw new DomainError('INVALID_BID', 'An RFQ needs at least one line to compare bids');
  }
  rfq.lines.forEach((line) => assertQuantityMilli(line.quantityMilli));
  assertValidCriteria(rfq.criteria);
}

function toRow(item: Scored, rank: number | null, ids: LowestIds): BidComparisonRow {
  return {
    bidId: item.bid.bidId,
    supplierId: item.bid.supplierId,
    supplierName: item.bid.supplierName,
    status: item.bid.status,
    submittedAt: item.bid.submittedAt,
    lines: item.totals.lines,
    totalMinor: item.totals.totalMinor,
    maxLeadDays: item.totals.maxLeadDays,
    qualified: item.scored.qualified,
    ineligibilityReasons: item.totals.reasons,
    criteria: item.scored.criteria,
    missingCriterionIds: item.scored.missing,
    totalScorePpm: item.scored.totalScorePpm,
    rank,
    isLowestPriced: item.bid.bidId === ids.lowestPriced,
    isLowestQualified: item.bid.bidId === ids.lowestQualified,
  };
}

interface LowestIds {
  readonly lowestPriced: string | null;
  readonly lowestQualified: string | null;
}

/**
 * FR-06 comparison and evaluation engine. Pure and deterministic: the same
 * persisted bids, criteria and scores always yield the same matrix and
 * ranking. Score is decision support only; it never selects an award.
 *
 * - Lowest-priced bid: cheapest complete, same-currency, non-withdrawn bid,
 *   even if technically non-compliant or disqualified (shown, flagged).
 * - Lowest qualified bid: cheapest bid with no ineligibility reason; it is
 *   the only basis for price normalization (B-10).
 * - Only qualified bids receive a total score and a rank.
 */
export function compareBids(
  rfq: ComparisonRfq,
  bids: readonly BidInput[],
  scores: readonly ScoreInput[],
): BidComparison {
  assertRfq(rfq);
  assertScores(scores, bids, rfq.criteria);
  const evaluated: Evaluated[] = bids.map((bid) => ({
    bid,
    totals: computeBidTotals(bid, rfq.lines, rfq.currency),
    submittedAtMs: parseSubmittedAt(bid),
  }));

  const priced = evaluated.filter(
    (e) => e.totals.totalMinor !== null && e.totals.totalMinor > 0 && e.bid.status !== 'WITHDRAWN',
  );
  const lowestPriced = cheapest(priced);
  const lowestQualified = cheapest(evaluated.filter((e) => e.totals.reasons.length === 0));
  const lowestTotal = lowestQualified?.totals.totalMinor ?? null;

  const scored: Scored[] = evaluated.map((e) => ({
    ...e,
    scored: scoreRow(e, rfq, scores, lowestTotal),
  }));
  const ranked = scored.filter((s) => s.scored.qualified).sort(byRank);
  const unranked = scored.filter((s) => !s.scored.qualified).sort(byUnrankedOrder);
  const ids: LowestIds = {
    lowestPriced: lowestPriced?.bid.bidId ?? null,
    lowestQualified: lowestQualified?.bid.bidId ?? null,
  };

  return {
    currency: rfq.currency,
    rows: [
      ...ranked.map((item, index) => toRow(item, index + 1, ids)),
      ...unranked.map((item) => toRow(item, null, ids)),
    ],
    lowestPricedBidId: ids.lowestPriced,
    lowestQualifiedBidId: ids.lowestQualified,
    lowestQualifiedTotalMinor: lowestTotal,
    provisional: ranked.some((item) => item.scored.missing.length > 0),
  };
}
