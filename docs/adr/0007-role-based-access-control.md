# ADR-0007: Role-based access control and permission matrix

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

PRD §3 defines six actors with distinct permissions and explicit restrictions (requesters cannot
approve their own requests; suppliers cannot see competitors, scores, budgets or other RFQs;
receiving clerks cannot change commercial terms). Record-level access must be enforced in every
API method; the UI only reflects it.

## Decision Drivers

- Least privilege per PRD §3.
- One source of truth used by API guards, services and web navigation.
- Coarse role checks in middleware; record-level rules in services.

## Considered Options

1. Static role → permission matrix in `@bidflow/shared`, enforced by `requirePermission`.
2. Inline role lists per route.
3. Attribute-based policy engine.

## Decision Outcome

Chosen option: **static permission matrix** (`packages/shared/src/roles.ts`), roles stored in
`users.role` with a database CHECK constraint (migration 0002).

| Role (`users.role`)   | PRD §3 actor             |
| --------------------- | ------------------------ |
| `BUYER_ADMIN`         | Buyer Organization Admin |
| `REQUESTER`           | Requester                |
| `PROCUREMENT_OFFICER` | Procurement Officer      |
| `APPROVER`            | Approver / Finance       |
| `RECEIVING_CLERK`     | Receiving Clerk          |
| `SUPPLIER_USER`       | Supplier User            |

| Permission                | ADMIN | REQ | PO  | FIN | RCV | SUP | Status                          |
| ------------------------- | :---: | :-: | :-: | :-: | :-: | :-: | ------------------------------- |
| `organization:manage`     |   ✓   |     |     |     |     |     | ⏳ BF-012                       |
| `users:manage`            |   ✓   |     |     |     |     |     | ⏳ BF-015                       |
| `departments:read`        |   ✓   |  ✓  |  ✓  |  ✓  |     |     | ✅ BF-009                       |
| `departments:manage`      |   ✓   |     |     |     |     |     | ✅ BF-009                       |
| `purchase-requests:read`  |   ✓   |  ✓  |  ✓  |  ✓  |     |     | ⏳ BF-017                       |
| `purchase-requests:write` |   ✓   |  ✓  |     |     |     |     | ⏳ BF-017                       |
| `approvals:decide`        |   ✓   |     |     |  ✓  |     |     | ⏳ BF-020                       |
| `suppliers:read`          |   ✓   |     |  ✓  |  ✓  |     |     | ⏳ BF-024                       |
| `suppliers:manage`        |   ✓   |     |  ✓  |     |     |     | ⏳ BF-024                       |
| `rfqs:read`               |   ✓   |     |  ✓  |  ✓  |     |     | ⏳ BF-027                       |
| `rfqs:manage`             |   ✓   |     |  ✓  |     |     |     | ⏳ BF-027                       |
| `evaluations:read`        |   ✓   |     |  ✓  |  ✓  |     |     | ⏳ BF-037                       |
| `evaluations:score`       |   ✓   |     |  ✓  |     |     |     | ⏳ BF-038                       |
| `awards:recommend`        |   ✓   |     |  ✓  |     |     |     | ⏳ BF-040                       |
| `purchase-orders:read`    |   ✓   |     |  ✓  |  ✓  |  ✓  |     | ⏳ BF-044                       |
| `purchase-orders:issue`   |   ✓   |     |  ✓  |     |     |     | ⏳ BF-043                       |
| `receipts:record`         |   ✓   |     |     |     |  ✓  |     | ⏳ BF-045                       |
| `reports:read`            |   ✓   |     |  ✓  |  ✓  |     |     | ⏳ BF-048                       |
| `audit:read`              |   ✓   |     |     |  ✓  |     |     | ⏳ BF-051                       |
| `supplier-portal:access`  |       |     |     |     |     |  ✓  | ⏳ BF-033                       |
| `notifications:read`      |   ✓   |  ✓  |  ✓  |  ✓  |  ✓  |  ✓  | ⏳ BF-050                       |
| `demo:advance-clock`      |   ✓   |     |     |     |     |     | ⏳ BF-031 (non-production only) |

Record-level rules that the matrix cannot express live in services and are covered by
[ADR-0015](0015-supplier-portal-isolation-and-sealed-bids.md) (invited RFQs only, sealed bids)
and [ADR-0016](0016-approval-routing-and-segregation-of-duties.md) (no self-approval, required
finance approval cannot be overridden). Services re-check the permission even when the route
already did (defence in depth; see `department.service.ts`).

### Consequences

- Positive: pending endpoints already return 403 for the wrong role, so the authorization
  surface is testable before features exist (`apps/api/test/pending-routes.http.test.ts`).
- Positive: web navigation uses the same matrix, so users only see screens they can use.
- Negative: a user holds exactly one role; combined duties (e.g. admin who also approves) rely
  on `BUYER_ADMIN` breadth. Multi-role membership is revisited with BF-015.

## Links

- `packages/shared/src/roles.ts`, `apps/api/src/middleware/authorize.ts`
- `apps/web/src/routes/navigation.ts`
