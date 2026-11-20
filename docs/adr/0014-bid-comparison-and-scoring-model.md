# ADR-0014: Bid comparison and scoring model

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

FR-06 asks for a comparison grid, a price score
`price_points = (lowest_qualified_bid_total / this_bid_total) × price_weight`, buyer-entered
non-price scores (0–100) multiplied by configured weights, weights totalling 100 %, and exclusion
of disqualified bids from price normalization and award. The PRD §8 seed deliberately contains a
lowest-priced but technically unqualified bid. Score is decision support, not automatic award.

## Decision Drivers

- Transparent, reproducible formulas on persisted data (PRD §11).
- Clear distinction between the **lowest-priced** bid and the **lowest qualified** bid.
- Deterministic ranking; ties must never depend on database order.
- Snapshot-friendly: the same inputs must always produce the same output.

## Considered Options

1. Pure function in `@bidflow/shared` taking RFQ lines, criteria, bids, qualifications and scores.
2. SQL views computing scores.
3. Configurable scoring formulas per organization.

## Decision Outcome

Chosen option: **pure, deterministic engine** `compareBids(rfq, bids, scores)` (BF-008).

**Criteria** (`validateCriteria`, B-09): exactly one `PRICE` criterion, at least one
`QUALITATIVE` criterion, each weight 1–10 000 bps, unique ids, total exactly 10 000 bps. Invalid
criteria raise `INVALID_CRITERIA` with every issue listed.

**Eligibility.** Only submitted or withdrawn bids are passed in; drafts are sealed and never
reach the engine. A bid is _qualified_ when it has none of these reasons:
`WITHDRAWN`, `DISQUALIFIED` (evaluator decision with reason), `TECHNICALLY_NON_COMPLIANT`
(any line marked non-compliant), `CURRENCY_MISMATCH` (no FX conversion), `INCOMPLETE` (an RFQ line
not quoted), `NON_POSITIVE_TOTAL`.

**Totals.** Line total = unit price × quantity (ADR-0013); bid total = sum of line totals; lead
time = maximum line lead time.

**Reference bids.**

- _Lowest-priced_: cheapest complete, same-currency, non-withdrawn bid with a positive total —
  even if non-compliant or disqualified. Shown for transparency.
- _Lowest qualified_: cheapest qualified bid; the **only** basis for price normalization (B-10).

**Scores** (integer ppm of 100 points):

- Price: `round(lowestQualified × weightBps × 100 / bidTotal)`.
- Qualitative: `round(Σ evaluator scores × weightBps / evaluatorCount)` (mean of evaluators).
- Total = sum of criterion points; missing qualitative scores count as 0 and mark the comparison
  `provisional`. Unqualified bids get qualitative points for display but no price points, total
  or rank.

**Ranking** of qualified bids: total score desc → bid total asc → max lead time asc → submission
time asc → bid id asc. Ranks are unique (1..n).

**Recommendation** (`assessRecommendation`, FR-07): unqualified bids and provisional
comparisons are blocked; a qualified non-top-ranked choice is allowed but
`requiresJustification` (B-11) and triggers finance approval (ADR-0016).

Worked example (PRD §8, unit-tested): Metro Electrical USD 37,400.00 is lowest-priced but
non-compliant; Allied Facilities USD 41,000.00 is lowest qualified (60.0000 price points, total
93.00, rank 1); Peak HVAC USD 41,400.00 earns 59.4203 price points (total 92.42, rank 2).

On award, the comparison output, criteria and bid revision are stored in
`award_recommendations.award_snapshot_json` with a SHA-256 hash in the audit event so later
configuration changes do not rewrite history (BF-040, BF-041).

### Consequences

- Positive: one implementation for API (authoritative) and web (matrix display).
- Positive: every rule above has unit tests, including the PRD §8 case and each tie-breaker.
- Negative: scoring formula is fixed for the MVP; supplier performance weighting is post-MVP.

## Links

- `packages/shared/src/domain/bid-comparison.ts`, `scoring.ts`, `evaluation-criteria.ts`, `award-recommendation.ts`
- `packages/shared/test/domain/bid-comparison.test.ts`
