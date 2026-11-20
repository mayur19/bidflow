# ADR-0006: API conventions

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The PRD asks for centralized role checks, validated inputs and explicit structured errors for
permission denial, stale revisions, deadline closure and failed business rules (PRD §7). The web
client and future integrators need one predictable contract.

## Decision Drivers

- One response shape for every endpoint.
- Stable machine-readable error codes; no stack traces or SQL in responses.
- The documented surface must match the running surface, including unbuilt endpoints.

## Considered Options

1. REST + JSON with a uniform envelope and error-code catalogue.
2. GraphQL.
3. RPC-style endpoints.

## Decision Outcome

Chosen option: **versioned REST under `/api/v1` with a uniform envelope**:

- Success: `{ success: true, data, error: null, meta? }`; lists add
  `meta: { total, page, limit }` (`page` ≥ 1, `limit` ≤ 100, default 25).
- Failure: `{ success: false, data: null, error: { code, message, details?, requestId } }` with
  codes from `packages/shared/src/api-envelope.ts` (`VALIDATION_FAILED` 422, `UNAUTHENTICATED` 401,
  `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INVALID_STATE_TRANSITION` 409,
  `CSRF_FAILED` 403, `RATE_LIMITED` 429, `NOT_IMPLEMENTED` 501, `SERVICE_UNAVAILABLE` 503,
  `INTERNAL_ERROR` 500).
- Domain rule violations (`DomainError`) map to 422 with `details.domainCode`.
- Input validated at the boundary with shared zod schemas; unknown body keys rejected.
- Guards run before handlers: authentication → permission → validation → service.
- Endpoints not built yet are registered via `pendingRouter` with their permission and ticket:
  401/403 first, then 501 with `details.ticket`.
- Financial POSTs (approval decisions, award, PO issue, receipts) will accept an
  `Idempotency-Key` header (BF-047).
- The contract is `docs/api/openapi.yaml`, with `x-status` and `x-ticket` per operation.

### Consequences

- Positive: the client unwraps one shape; errors are testable by code.
- Positive: the backlog is visible from the API itself.
- Negative: pending routes must be kept in sync with the OpenAPI file during review.

## Links

- [API README](../api/README.md), [OpenAPI](../api/openapi.yaml)
- `apps/api/src/lib/not-implemented.ts`, `apps/api/src/middleware/error-handler.ts`
