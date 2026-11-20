# ADR-0013: Integer money, basis points and a single rounding rule

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

BidFlow multiplies unit prices by (possibly fractional) quantities, sums line totals, compares
bid totals, applies percentage weights and checks budgets. PRD §2 mandates integer minor units,
basis points for rates, a fixed RFQ currency and no floating-point pricing arithmetic. Inconsistent
rounding between line totals, PO totals and budget checks would make awards and purchase orders
irreconcilable with the original bid (Goal 4).

## Decision Drivers

- Exactness: `0.1 + 0.2` style errors are unacceptable in bid totals and budget checks.
- One rounding rule, applied in one place, documented and tested.
- Values must serialize to JSON without custom codecs and display identically in API and web.
- Overflow must fail loudly, never silently lose precision.

## Considered Options

1. Integer minor units in JS `number` (bounded to the safe-integer range) with `BigInt` for
   intermediate products, basis points for rates, fixed-point milli-unit quantities.
2. A decimal library (arbitrary precision decimals) everywhere.
3. `BigInt` throughout, including JSON payloads.
4. PostgreSQL `numeric` with arithmetic in SQL.

## Decision Outcome

Chosen option: **integer minor units with BigInt intermediates** (implemented in
`packages/shared/src/domain/`, BF-007):

| Concept           | Representation                                                                             | Example                   |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| Money             | `{ amountMinor: integer, currency: 'USD' }`; `bigint` column with `CHECK (0 ≤ x ≤ 2^53−1)` | USD 41,400.00 → `4140000` |
| Currency exponent | ISO 4217 (2 default; JPY 0; KWD 3)                                                         |                           |
| Rate / weight     | integer basis points, 10 000 = 100 %                                                       | 60 % → `6000`             |
| Quantity          | integer milli-units (3 decimals), `numeric(14,3)` in SQL                                   | 2.5 m → `2500`            |
| Score             | integer parts-per-million of 100 points                                                    | 92.4203 → `924203`        |

**Rounding rule — ROUND HALF UP (half away from zero), applied once per derived value at the end
of an exact BigInt computation** (`divideRoundHalfUp`):

- Line total = `round(unitPriceMinor × quantityMilli / 1000)`.
- Bid / PO total = sum of already-rounded line totals (never re-rounded).
- Rate application = `round(amountMinor × bps / 10 000)`.
- Price score points = `round(lowest × weightBps × 100 / total)` in ppm (ADR-0014).
- Display rounding (scores to 2 decimals) is presentation only and never fed back into
  calculations.

Guards: `toSafeNumber` throws `AMOUNT_OVERFLOW` when a result leaves ±(2^53−1); currencies are
validated and never mixed (`CURRENCY_MISMATCH`); user input is parsed from strings
(`parseMajorUnits`, `parseQuantity`) and rejects more decimals than allowed instead of rounding
them away. Formatting is string-based (`USD 41,000.00`) without `Intl` float conversion.

### Consequences

- Positive: identical results in API and web; 100 % branch coverage enforced in CI.
- Positive: amounts are plain JSON numbers.
- Negative: the ceiling is ~90 trillion minor units per value — far above SMB procurement needs;
  exceeding it is an explicit error.
- Negative: half-up has a slight upward bias over many roundings versus banker's rounding; we
  accept it because suppliers and buyers expect commercial rounding and each line rounds once.

## Links

- `packages/shared/src/domain/rounding.ts`, `money.ts`, `line-total.ts`, `basis-points.ts`, `quantity.ts`
- `packages/shared/test/domain/`
- [ADR-0014](0014-bid-comparison-and-scoring-model.md)
