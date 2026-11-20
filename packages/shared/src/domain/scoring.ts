import type { BidInput, CriterionPoints, ScoreInput } from './bid-types.js';
import { DomainError } from './errors.js';
import type { EvaluationCriterion } from './evaluation-criteria.js';
import { divideRoundHalfUp, toSafeNumber } from './rounding.js';

/**
 * Scores are integers in parts-per-million of the 100-point scale:
 * 1 000 000 ppm = 100.0000 points. Each criterion is rounded once (ROUND
 * HALF UP) to 1 ppm; display rounding to 2 decimals happens in formatScore.
 */
export const SCORE_SCALE_PPM = 1_000_000;
const PPM_PER_BPS = 100n;

/**
 * FR-06 price score: (lowest qualified total / this total) × price weight.
 *   ppm = lowest × weightBps × 100 / total
 */
export function pricePointsPpm(
  lowestQualifiedTotalMinor: number,
  bidTotalMinor: number,
  weightBps: number,
): number {
  if (lowestQualifiedTotalMinor <= 0 || bidTotalMinor < lowestQualifiedTotalMinor) {
    throw new DomainError('INVALID_BID', 'Price points need positive totals >= the lowest total');
  }
  const exact = BigInt(lowestQualifiedTotalMinor) * BigInt(weightBps) * PPM_PER_BPS;
  return toSafeNumber(divideRoundHalfUp(exact, BigInt(bidTotalMinor)), 'price points');
}

/** Mean evaluator score (0–100) × weight:  ppm = Σscores × weightBps / count. */
export function qualitativePointsPpm(scores: readonly number[], weightBps: number): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((total, score) => total + BigInt(score), 0n);
  return toSafeNumber(divideRoundHalfUp(sum * BigInt(weightBps), BigInt(scores.length)));
}

/** 924203 ppm -> "92.42". */
export function formatScore(ppm: number): string {
  const hundredths = divideRoundHalfUp(BigInt(ppm), 100n);
  const digits = hundredths.toString().padStart(3, '0');
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function assertScores(
  scores: readonly ScoreInput[],
  bids: readonly BidInput[],
  criteria: readonly EvaluationCriterion[],
): void {
  const bidIds = new Set(bids.map((bid) => bid.bidId));
  const qualitative = new Set(criteria.filter((c) => c.kind === 'QUALITATIVE').map((c) => c.id));
  const seen = new Set<string>();
  for (const s of scores) {
    const key = `${s.bidId}|${s.criterionId}|${s.evaluatorId}`;
    const problem =
      !Number.isInteger(s.score) || s.score < 0 || s.score > 100
        ? 'Scores must be whole numbers from 0 to 100'
        : !bidIds.has(s.bidId)
          ? 'Score references an unknown bid'
          : !qualitative.has(s.criterionId)
            ? 'Scores apply only to non-price criteria of this RFQ'
            : seen.has(key)
              ? 'Duplicate score for the same bid, criterion and evaluator'
              : null;
    if (problem) throw new DomainError('INVALID_SCORE', problem, { score: s });
    seen.add(key);
  }
}

/** Qualitative points for one bid; price criterion is filled in by the caller. */
export function qualitativeCriteriaPoints(
  bidId: string,
  criteria: readonly EvaluationCriterion[],
  scores: readonly ScoreInput[],
): CriterionPoints[] {
  return criteria
    .filter((c) => c.kind === 'QUALITATIVE')
    .map((criterion) => {
      const values = scores
        .filter((s) => s.bidId === bidId && s.criterionId === criterion.id)
        .map((s) => s.score);
      return {
        criterionId: criterion.id,
        kind: criterion.kind,
        weightBps: criterion.weightBps,
        evaluatorCount: values.length,
        pointsPpm: qualitativePointsPpm(values, criterion.weightBps),
      };
    });
}
