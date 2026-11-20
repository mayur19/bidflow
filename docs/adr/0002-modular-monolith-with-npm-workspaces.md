# ADR-0002: Modular monolith with npm workspaces

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

BidFlow targets small and medium buying organizations. The PRD requires a single locally
runnable application (no Docker, no external services) covering requests, approvals, RFQs,
supplier bidding, evaluation, purchase orders and receipts. The money and bid-comparison rules
must produce identical results in the API (authoritative) and the web UI (display and form
pre-validation).

## Decision Drivers

- One command to run the whole product locally (`./run.sh`).
- Strong module boundaries without distributed-system overhead.
- Share validation schemas and pure domain logic between API and web with no duplication.
- Strict TypeScript end to end.

## Considered Options

1. Modular monolith: one Express API, one React SPA, one shared package, npm workspaces.
2. Microservices per bounded context (requests, sourcing, purchasing).
3. Full-stack framework with server components (e.g. a meta-framework).

## Decision Outcome

Chosen option: **modular monolith with npm workspaces**:

- `apps/api` (`@bidflow/api`): Express, layered per module as `routes → service → repository`.
- `apps/web` (`@bidflow/web`): React + Vite SPA.
- `packages/shared` (`@bidflow/shared`): zod schemas, role/permission matrix, and pure domain
  modules (`src/domain/`: money, quantities, basis points, bid comparison).

Each API module lives in `apps/api/src/modules/<module>/` and owns its routes, service and
repository. Modules talk to each other through services, never through another module's tables.
Not-yet-built modules are registered as pending routers so the API surface matches the contract.

### Consequences

- Positive: a single deployable unit; transactions span modules where invariants require it
  (award → PO draft, PO issue → budget commitment).
- Positive: the comparison engine is one implementation used by both API and web.
- Negative: module discipline is a convention; reviewers must reject cross-module table access.
- Negative: scaling is vertical first; see `docs/design/system-design.md` for the extraction path.

## Links

- [ADR-0006 API conventions](0006-api-conventions.md)
- [docs/architecture/overview.md](../architecture/overview.md)
