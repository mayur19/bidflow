# ADR-0008: Append-only audit trail

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

FR-10 requires an append-only event log for request state, RFQ publication, bid submission and
versions, evaluation, disqualification, award approval, PO issue and receipts, including actor,
organization, entity, event type, timestamp and relevant snapshot hashes. Goal 4 requires award
and PO terms to be traceable back to the original bid.

## Decision Drivers

- An audit row must exist if and only if the business change committed.
- Rows are never updated or deleted by the application.
- Queryable per organization and per entity.

## Considered Options

1. `audit_events` table written in the same database transaction as the change.
2. Asynchronous event bus to a separate store.
3. Database triggers on every table.

## Decision Outcome

Chosen option: **transactional `audit_events` table** (`organization_id`, `actor_user_id`,
`action`, `entity_type`, `entity_id`, `metadata jsonb`, `request_id`, `occurred_at`). Services call
`recordAudit(tx, …)` with the transaction client. Action names are `<entity>.<verb>`
(`department.created`, `auth.login`; planned `rfq.published`, `bid.submitted`, `award.approved`,
`purchase_order.issued`, `receipt.recorded`). Snapshot-bearing events store a SHA-256 hash of the
canonical JSON snapshot in `metadata.snapshotHash` (BF-040, BF-041).

In production the application database role is granted `INSERT, SELECT` only on `audit_events`
(BF-059).

### Consequences

- Positive: implemented for login and department creation; the integration test proves a failed
  create leaves no audit row.
- Negative: audit volume grows with activity; retention policy in
  `docs/architecture/quality-attributes.md`.
- Pending: audit viewer and API (BF-051).

## Links

- `apps/api/src/modules/audit/audit.service.ts`
