# ADR-0018: Budget commitment control preventing over-budget purchase orders

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

Goal 5: unapproved or over-budget purchases cannot silently become purchase orders. FR-01 frames
budgets as planning/approval controls (not a ledger) showing requested, approved and committed
amounts. Departments with budgets are implemented (BF-009); per-period budgets and commitments
are pending (BF-014, BF-043).

## Decision Drivers

- The check and the commitment must be atomic; two concurrent PO issues must not both pass.
- Definitions must be explicit and shown in the UI.
- Exceptions must be possible but approved and audited.

## Considered Options

1. Compute committed spend from issued POs inside the issuing transaction, with a row lock on the
   department budget period.
2. Maintain a running balance column updated by triggers.
3. Check at award time only.

## Decision Outcome

Chosen option: **option 1**.

Definitions (per department and budget period, integer minor units, organization currency):

- **Requested** = Σ estimated totals of submitted, not-rejected/cancelled purchase requests.
- **Approved** = Σ estimated totals of approved requests not yet ordered.
- **Committed** = Σ totals of `ISSUED`, `PARTIALLY_RECEIVED` and `FULLY_RECEIVED` POs.
- **Remaining** = budget − committed.

Issuing a PO (BF-043), in one transaction: `SELECT … FOR UPDATE` the budget period row; recompute
committed; if `committed + po.total > budget` and no approved budget-exception step exists for
this award, reject with `CONFLICT` (`details.reason = 'OVER_BUDGET'`) and write a
`purchase_order.issue_denied` audit event; otherwise set status `ISSUED`, `issued_at`, and audit
`purchase_order.issued`. Award approval (ADR-0016) already routes over-budget awards to finance,
which creates the exception step. Cancelling a PO releases its commitment.

### Consequences

- Positive: the over-budget invariant is enforced under concurrency; denial is auditable.
- Negative: budget periods serialize PO issuance per department period (acceptable at SMB volume).

## Links

- [ADR-0013](0013-integer-money-basis-points-and-rounding.md), [ADR-0016](0016-approval-routing-and-segregation-of-duties.md)
