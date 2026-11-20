# ADR-0017: Procurement lifecycle state machines

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

The PRD defines lifecycles for purchase requests (FR-02), RFQs (FR-04), bids (FR-05) and purchase
orders (FR-08), and requires that POs and receipts are generated only after authorized state
transitions (PRD §11). Concurrent users (two approvers, a supplier submitting at the deadline)
must not corrupt state.

## Decision Drivers

- Explicit allowed transitions with guards, testable as pure functions.
- Database-level protection against lost updates and duplicate records.
- Server clock is the only clock for deadlines.

## Considered Options

1. Per-aggregate transition tables in `@bidflow/shared` (pure), enforced by services with
   optimistic locking and conditional `UPDATE … WHERE status = $from AND version = $v`.
2. Status columns updated freely with ad-hoc checks.
3. Event sourcing.

## Decision Outcome

Chosen option: **pure transition tables + conditional updates**.

| Aggregate            | States                                                                                                       | Key guards                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purchase request     | `DRAFT → SUBMITTED → APPROVED / REJECTED → SOURCING → AWARDED → ORDERED → RECEIVED`; `CANCELLED` with reason | submit requires ≥ 1 valid line; edit after submit creates a new revision (`version`+1) and returns to `DRAFT`; approvals per ADR-0016                            |
| RFQ                  | `DRAFT → PUBLISHED → CLOSED → EVALUATING → AWARD_PENDING → AWARDED`; `CANCELLED`                             | publish requires valid criteria and ≥ 1 invitation; published lines frozen; amendments bump `revision`; close at `deadline_at` (server UTC) or early with reason |
| Supplier bid         | `DRAFT → SUBMITTED → WITHDRAWN`; each save is a new revision                                                 | submit/withdraw only while `now() < deadline_at` and RFQ `PUBLISHED`; read-only after close                                                                      |
| Award recommendation | `PENDING_APPROVAL → APPROVED / REJECTED / CLARIFICATION_REQUESTED`                                           | author ≠ approver; approved award creates exactly one PO draft (`UNIQUE (award_id)` on `purchase_orders`)                                                        |
| Purchase order       | `DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED`; `CANCELLED` with reason                              | issue requires approved award and budget check (ADR-0018); issued lines immutable; cumulative receipts ≤ ordered quantity                                        |

Invalid transitions return `INVALID_STATE_TRANSITION` (409); a version mismatch returns `CONFLICT`
(409, stale revision). Deadline comparisons use `now()` in the database transaction, never a
client timestamp (B-08). A non-production `advance-deadline` action supports automated tests
(BF-031).

### Consequences

- Positive: each lifecycle is unit-testable without a database; SQL conditions stop races.
- Negative: transition tables must stay aligned with `docs/design/system-design.md` diagrams.

## Links

- [System design state machines](../design/system-design.md)
