# ADR-0003: Multi-tenancy by row-level organization scoping

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Many buyer organizations share one deployment. A buyer organization must never see another
organization's requests, budgets, RFQs, bids or purchase orders (PRD §3, acceptance test B-18).
Supplier organizations are directory entries of a buyer organization in the MVP and are scoped
the same way (see [ADR-0015](0015-supplier-portal-isolation-and-sealed-bids.md)).

## Decision Drivers

- Zero cross-tenant data exposure, provable by automated tests.
- Simple operations: one database, one schema, standard migrations.
- Tenant identity must come from the authenticated session, never from client input.

## Considered Options

1. Shared schema with an `organization_id` column on every tenant-owned table.
2. Schema per tenant.
3. Database per tenant.
4. Shared schema plus PostgreSQL row-level security (RLS) policies.

## Decision Outcome

Chosen option: **shared schema with `organization_id` on every tenant-owned row**. The PRD calls
this key `buyer_org_id`; the implemented column name is `organization_id` and `organizations`
implements `buyer_organizations`.

Rules:

- Repositories take `organizationId` as an explicit first argument and include it in every
  `WHERE` clause, including lookups by primary key (`WHERE organization_id = $1 AND id = $2`).
- `organizationId` is read from `req.auth.user`, never from the request body, query or path.
  Shared zod schemas are `.strict()` so a client-supplied `organizationId` is rejected.
- A record from another tenant is indistinguishable from a missing record: **404**, not 403.
- Tables expose `UNIQUE (organization_id, id)` so child tables can use composite foreign keys
  that make cross-tenant references impossible at the database level.
- RLS is deferred: it is a defence-in-depth option once a dedicated application role exists
  (BF-057 evaluates it).

### Consequences

- Positive: implemented for departments (BF-009) with an integration test proving Harborview
  Clinics receives 404 for a Cedar Grove Hotels department id (BF-011).
- Positive: cheap to operate and migrate.
- Negative: a forgotten `WHERE organization_id` is a data leak; mitigated by repository
  conventions, code review and the planned tenant-isolation sweep (BF-057).

## Links

- `apps/api/src/modules/departments/department.repository.ts`
- `apps/api/test/departments.db.test.ts`
- [Threat model](../security/threat-model.md)
