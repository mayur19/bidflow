# ADR-0004: PostgreSQL and forward-only SQL migrations

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Award, purchase-order and receipt invariants need real transactions, row locks, unique and check
constraints (PRD §6). The PRD allows local PostgreSQL via `pg` (SQLite fallback optional).

## Decision Drivers

- ACID transactions and `SELECT … FOR UPDATE` for budget and receipt invariants.
- Constraints in the database, not only in code (role CHECK, money ranges, uniqueness).
- Reviewable, reproducible schema history.

## Considered Options

1. PostgreSQL with plain SQL migration files and a small runner.
2. PostgreSQL with an ORM and generated migrations.
3. SQLite.

## Decision Outcome

Chosen option: **PostgreSQL 17 with forward-only SQL migrations** in `apps/api/migrations/NNNN_name.sql`,
applied in lexical order by `apps/api/src/db/migrate.ts`, each in its own transaction. Applied
files are checksummed in `schema_migrations`; editing an applied migration aborts the run. Fixes
ship as a new migration. Queries use parameterized `pg` calls only.

Implemented: `0001_foundation.sql` (organizations, users, sessions, audit_events) and
`0002_buyer_roles_and_departments.sql` (role CHECK, organization currency, departments).

### Consequences

- Positive: schema is explicit and diffable; constraints back up application rules.
- Negative: no down migrations; rollbacks are new forward migrations (expand/contract, see
  `docs/operations/deployment.md`).
- Negative: hand-written row mappers; kept small per repository.

## Links

- [Data model](../design/data-model.md)
- [Runbook](../operations/runbook.md)
