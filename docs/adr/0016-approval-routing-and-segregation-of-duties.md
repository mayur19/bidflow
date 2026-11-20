# ADR-0016: Approval routing and segregation of duties

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

FR-02 and FR-07 require manager approval for requests, finance approval above the organization's
spend threshold, finance approval for over-budget or non-top-scoring awards, and no
self-approval. Procurement officers cannot override required approvals (PRD §3). Goal 5:
unapproved or over-budget purchases cannot silently become purchase orders.

## Decision Drivers

- Approval requirements derived by deterministic rules from persisted data.
- Segregation of duties enforced in SQL-backed workflows (PRD §11).
- Ordered, auditable decisions; idempotent on retry.

## Considered Options

1. Generated `approval_steps` rows (`subject_type`, `subject_id`, `step_order`, `required_role`)
   from a pure rules function, decided through one `/approvals/:id/decision` endpoint.
2. Hard-coded status checks in each module.
3. A configurable workflow engine.

## Decision Outcome

Chosen option: **generated approval steps** (BF-019, BF-020, BF-041).

- Purchase request steps: (1) department manager (`APPROVER` with department membership);
  (2) finance `APPROVER` when `estimated_total_minor > organization.approval_threshold_minor`.
- Award steps: finance approval when total > threshold, total exceeds remaining department
  budget, or the recommended bid is not rank 1 (requires justification, B-11).
- A step can be decided only when all lower `step_order` steps are approved.
- The decider must not be the request author or recommendation author (checked in the service
  and by a `CHECK`-backed trigger on `decided_by <> subject author`).
- Decisions are `APPROVED`, `REJECTED` (reason required) or `CLARIFICATION_REQUESTED`.
- Each decision writes an audit event in the same transaction; duplicate POSTs are absorbed by
  `Idempotency-Key` (BF-047) and a unique `(approval_step_id)` decision constraint.

### Consequences

- Positive: B-02, B-03 and B-11 reduce to rule tests plus API assertions.
- Negative: no delegation or out-of-office routing in the MVP.

## Links

- [ADR-0017](0017-procurement-lifecycle-state-machines.md), [ADR-0018](0018-budget-commitment-control.md)
