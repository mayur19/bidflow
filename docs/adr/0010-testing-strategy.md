# ADR-0010: Testing strategy

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

PRD §9 lists eighteen acceptance tests (B-01..B-18) and asks for unit tests of weighted scoring,
monetary math, approval thresholds, deadline comparisons and receipt totals, with end-to-end
scenarios on the actual database.

## Decision Drivers

- Domain rules (money, scoring) must be exhaustively verified in isolation.
- Tenant isolation and authorization must be proven against real PostgreSQL, not mocks.
- Fast feedback locally; identical checks in CI.

## Considered Options

1. Vitest unit tests, supertest HTTP tests, real-PostgreSQL integration tests, Playwright E2E.
2. Mock-heavy unit tests only.
3. E2E-only testing.

## Decision Outcome

Chosen option: **a test pyramid**:

- Unit (Vitest): pure domain in `packages/shared/src/domain` with a **100 %** coverage threshold;
  services with injected fakes.
- HTTP (supertest + fake pool): middleware, envelopes, permission gates, pending routes.
- Integration (supertest + disposable PostgreSQL `<db>_test`, schema dropped per suite, files run
  sequentially): tenancy, RBAC, audit atomicity.
- E2E (Playwright, real database): smoke today; acceptance B-01..B-18 in BF-054..BF-056.
- Gates: ≥ 80 % overall coverage; `./run.sh check` mirrors CI.

### Consequences

- Positive: the engine's edge cases are cheap to test and fully covered.
- Negative: integration suites share one database and cannot run in parallel.

## Links

- [Test strategy](../testing/test-strategy.md)
