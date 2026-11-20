# ADR-0012: In-app notifications and background worker

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

FR-09 requires in-app alerts (approval requested, RFQ published, bid submitted, RFQ closing,
award decided, delivery overdue). External email is a non-goal. Two alerts are time-based
(RFQ closing soon, delivery overdue), and RFQ deadlines must close bidding using the server clock.

## Decision Drivers

- No external email or message broker.
- Time-based work must be idempotent across restarts and safe with more than one API instance.

## Considered Options

1. `notifications` table written in the business transaction, plus an in-process polling worker
   using `FOR UPDATE SKIP LOCKED` job claims.
2. A message broker with consumers.
3. Cron jobs outside the application.

## Decision Outcome

Chosen option: **transactional notifications + polling worker** (BF-050). Event-driven alerts are
inserted in the same transaction as the triggering change. A worker started with the API polls
every minute for RFQs closing within 24 hours and overdue PO lines, inserting notifications with a
unique `(recipient, kind, subject_id, window)` key so repeats are no-ops. Deadline enforcement does
not depend on the worker: submission checks compare against the server clock directly (ADR-0017).

### Consequences

- Positive: no extra infrastructure; notifications are consistent with the data.
- Negative: polling latency of up to one minute for time-based alerts.

## Links

- [System design](../design/system-design.md)
