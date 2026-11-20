# ADR-0015: Supplier portal isolation and sealed-bid visibility

- **Status:** Accepted (portal namespace and permission gate); Proposed (record-level rules, BF-033..BF-035)
- **Date:** 2026-11-20

## Context

Suppliers use the same application as buyers but must only see RFQs they are explicitly invited
to, only their own bids, and never competitors' identities, internal scores, budgets or other
RFQs — before or after close (PRD §3, FR-03, FR-05; tests B-05, B-06). Buyers must not see bid
contents before the RFQ closes ("prevent sensitive supplier bids from appearing in broad list
queries before close", PRD §6). Confidentiality must be enforced on the backend (PRD §11).

## Decision Drivers

- Separate API namespace and payload shapes for suppliers.
- Hiding by construction (queries that cannot return other suppliers' rows), not by filtering
  responses.
- 404 rather than 403 for records outside the caller's scope, so existence does not leak.

## Considered Options

1. Supplier users as `users` rows with role `SUPPLIER_USER`, scoped to the provisioning buyer
   organization, linked to one supplier organization via `supplier_memberships`; dedicated
   `/api/v1/supplier/*` namespace.
2. A separate supplier application and database.
3. Shared endpoints with response filtering by role.

## Decision Outcome

Chosen option: **option 1**.

- The buyer provisions a supplier login (simulated portal invitation, no email; BF-025). The
  session resolves `organizationId` (the buyer tenant) and, via `supplier_memberships`, the
  caller's `supplierOrgId`.
- `SUPPLIER_USER` holds only `supplier-portal:access` and `notifications:read`. Every buyer route
  returns 403 for suppliers, and every supplier route returns 403 for buyers — already enforced
  for the pending surface and tested.
- Supplier queries always join `rfq_invitations` on `(organization_id, rfq_id, supplier_org_id =
caller)`; bid queries always filter `supplier_org_id = caller`. Out-of-scope ids return 404.
- Supplier DTOs are separate types that have no fields for competitors, scores, budgets or
  internal notes.
- **Sealed bids:** before `closed_at`, buyer-side endpoints expose only bid counts and
  per-supplier status (invited / responded), never prices or lines. Comparison, evaluation and
  qualification endpoints return 409 until the RFQ is closed. Drafts are never visible to buyers.
- Deactivated suppliers keep read access to past submissions but cannot create or submit bids.

The PRD's separate `supplier_users` table is realised as `users` + `supplier_memberships` so one
authentication path serves both sides; a later multi-buyer supplier identity can be introduced
without changing the portal API.

### Consequences

- Positive: isolation is enforced in SQL and in types; B-05/B-06 become simple assertions.
- Negative: a supplier serving two buyer organizations needs two logins in the MVP (documented
  limitation; post-MVP vendor self-registration).

## Links

- `apps/api/src/modules/supplier-portal/supplier-portal.routes.ts`
- `apps/api/test/pending-routes.http.test.ts`
- [Threat model](../security/threat-model.md)
