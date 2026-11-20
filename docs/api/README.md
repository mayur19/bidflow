# BidFlow API

The full contract lives in [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1). Every operation carries
`x-status: implemented | pending` and `x-ticket: BF-xxx`, so the spec doubles as an implementation
map against [`../planning/backlog.md`](../planning/backlog.md). This page covers the conventions every
endpoint follows. The decisions behind them are in
[ADR-0006](../adr/0006-api-conventions.md) (API conventions),
[ADR-0005](../adr/0005-session-authentication-scrypt-and-csrf.md) (sessions and CSRF) and
[ADR-0007](../adr/0007-role-based-access-control.md) (roles and permissions).

## Versioning and base paths

| Path                | Purpose                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `/api/v1/*`         | Versioned product API (auth, departments, every PRD §7 resource)      |
| `/api/health/live`  | Liveness. Never touches dependencies                                  |
| `/api/health/ready` | Readiness. Verifies PostgreSQL and returns 503 when it is unreachable |

Breaking changes get a new prefix (`/api/v2`). Adding a field or an optional parameter does not
count as breaking. Clients must ignore fields they do not recognise.

In local development the web dev server on port **5172** proxies `/api` to the API on port
**4102**. Both work for the examples below. Use 5172 when you want the browser's Origin.

## Response envelope

Every response, success or failure, has the same shape:

```json
{
  "success": true,
  "data": { "...": "..." },
  "error": null,
  "meta": { "total": 3, "page": 1, "limit": 25 }
}
```

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": [
      { "path": "budgetMinor", "message": "Budget must be a whole number of minor units" }
    ],
    "requestId": "6f1c2c1e-7a8b-4d5e-9f00-1a2b3c4d5e6f"
  }
}
```

- `meta` appears only on paginated lists.
- `requestId` matches the `X-Request-Id` response header and the server log line. Clients may
  send their own `X-Request-Id` (8–64 characters from `[A-Za-z0-9-]`).
- Stack traces, SQL and internal identifiers never appear in error bodies.

## Error codes

| Code                       | HTTP | Meaning                                                                                                                                                                        |
| -------------------------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VALIDATION_FAILED`        |  422 | Body, query or path failed schema validation (`details` lists field issues), the JSON was malformed, or a domain rule rejected the input (`details.domainCode`, see below)     |
| `UNAUTHENTICATED`          |  401 | No valid session, or login failed. Login failures always return the same message                                                                                               |
| `FORBIDDEN`                |  403 | The role lacks the permission for this endpoint, or a record-level rule denies the action (for example self-approval)                                                          |
| `NOT_FOUND`                |  404 | Unknown route, or a record that does not exist **in the caller's organization**. Records owned by other tenants return 404 rather than 403, so their existence is not revealed |
| `CONFLICT`                 |  409 | Duplicate (unique constraint), stale `version`, or an idempotency key reused with a different body                                                                             |
| `INVALID_STATE_TRANSITION` |  409 | Lifecycle transition not allowed from the current state ([ADR-0017](../adr/0017-procurement-lifecycle-state-machines.md)); `details` has `from` and `to`                       |
| `CSRF_FAILED`              |  403 | Missing or invalid `X-CSRF-Token`, or a cross-origin unsafe request                                                                                                            |
| `RATE_LIMITED`             |  429 | Too many requests in the window                                                                                                                                                |
| `NOT_IMPLEMENTED`          |  501 | Endpoint is part of the contract but not built yet; `details.ticket` names the backlog ticket                                                                                  |
| `SERVICE_UNAVAILABLE`      |  503 | A dependency (PostgreSQL) is unavailable                                                                                                                                       |
| `INTERNAL_ERROR`           |  500 | Unexpected failure. Logged with the request id, with no details in the response                                                                                                |

### Domain rule failures

Pure domain functions in `@bidflow/shared` throw a `DomainError`. The API maps every one of them to
**422 `VALIDATION_FAILED`** with `details.domainCode` set, plus `details.issues` when the rule has
more to say (for example, each problem with the evaluation criteria):

| `domainCode`                             | Raised when                                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_AMOUNT`                         | An amount is not an integer number of minor units, is negative where that is not allowed, or has more decimals than the currency allows  |
| `AMOUNT_OVERFLOW`                        | A result would exceed the JavaScript safe-integer range                                                                                  |
| `INVALID_CURRENCY` / `CURRENCY_MISMATCH` | A code is not three upper-case letters, or two amounts in different currencies are combined                                              |
| `INVALID_QUANTITY`                       | A quantity is zero, negative, or has more than three decimals                                                                            |
| `INVALID_RATE`                           | A basis-point rate is outside its range                                                                                                  |
| `INVALID_CRITERIA`                       | Evaluation weights do not total 100 %, or the RFQ does not have exactly one price criterion plus at least one non-price criterion (B-09) |
| `INVALID_SCORE` / `INVALID_BID`          | An evaluator score is outside 0–100, or bid data is inconsistent with the RFQ                                                            |

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Evaluation criteria are invalid",
    "details": {
      "domainCode": "INVALID_CRITERIA",
      "issues": [
        {
          "code": "WEIGHTS_NOT_100_PERCENT",
          "message": "Criterion weights must total 100% (10000 bps); current total is 9500 bps"
        }
      ]
    }
  }
}
```

## Authentication and CSRF

1. `POST /api/v1/auth/login` with `{ "email", "password" }`. On success the response sets an
   `HttpOnly; SameSite=Lax` session cookie (`sid`) and returns `data.csrfToken`.
2. Send `X-CSRF-Token: <csrfToken>` on every `POST`, `PUT`, `PATCH` and `DELETE` while signed in.
   The token is an HMAC of the session, so it changes when the session changes.
3. On unsafe requests the `Origin` header (or `Referer`) must match `APP_ORIGIN`
   (`http://localhost:5172` locally). Requests with no Origin are accepted, so curl works, but they
   still need the CSRF token once authenticated.
4. `GET /api/v1/auth/session` returns the current user and a fresh `csrfToken`. The web app calls it
   on page load.
5. `POST /api/v1/auth/logout` deletes the server-side session.

Only the SHA-256 of the session token is stored, and sessions expire after `SESSION_TTL_MINUTES`.

## Authorization

Every endpoint names one permission from the shared matrix in `packages/shared/src/roles.ts`. The
OpenAPI description of each operation says which one. The middleware answers **401** with no session
and **403** when the role does not hold the permission. Pending endpoints do both of these checks
**before** returning 501, so their access rules can be tested today.

Services also enforce record-level rules: tenant scoping on every query, no self-approval, invited
RFQs only for supplier users, and no sealed bids before close
([ADR-0015](../adr/0015-supplier-portal-isolation-and-sealed-bids.md)). Supplier users can call only
`/api/v1/supplier/*`, `/api/v1/notifications` and their account endpoints.

## Pagination, filtering and search

- Query parameters: `page` (default 1) and `limit` (default 25, maximum 100). A value out of range
  returns 422.
- Paginated responses include `meta: { total, page, limit }`.
- `q` performs a case-insensitive search on the resource's main text fields. `%`, `_` and `\` are
  escaped and matched literally.
- Resource filters (for example `status` and `departmentId` on purchase requests) are plain query
  parameters, validated by zod schemas in `packages/shared`.
- Sort order is fixed and documented per resource (departments: `code` ascending). Configurable sort
  arrives with the list screens that need it.

## Money, rates and quantities

See [ADR-0013](../adr/0013-integer-money-basis-points-and-rounding.md).

| Kind              | Wire format                                                                                                          | Example                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Money             | `{ "amountMinor": integer, "currency": "USD" }`. Integer minor units, never a float or a decimal string              | `{ "amountMinor": 4140000, "currency": "USD" }` is USD 41,400.00 |
| Money input field | `*Minor` integer (for example `budgetMinor`). The currency comes from the organization or RFQ, never from the client | `"budgetMinor": 1575050`                                         |
| Rate or weight    | Integer basis points, where 10000 = 100 %                                                                            | `"weightBps": 6000`                                              |
| Quantity          | Integer thousandths of a unit (`quantityMilli`)                                                                      | `20000` is 20 units, `2500` is 2.5 m                             |
| Score             | Integer parts per million of 100 points (`pointsPpm`, `totalScorePpm`)                                               | `924203` is 92.42 points                                         |

Values range from −(2^53 − 1) to 2^53 − 1. Rounding is half up (away from zero) and happens once, at
the end of an exact integer calculation. Scores are rounded to two decimals only for display.
Bids in a currency other than the RFQ currency are rejected, never converted.

## Concurrency and idempotency

- Mutable resources expose `version`. Updates send the expected `version`, and a stale value returns
  **409 `CONFLICT`**.
- **Planned (BF-047):** financial POSTs accept an `Idempotency-Key` header. These are approval
  decisions, award recommendations, PO issue and receipts. A replayed key returns the original
  response, and the same key with a different body returns 409. Until then, these endpoints are
  pending, and a unique constraint on the award (one PO per award) will back the same
  guarantee at the database (B-17).

## Rate limits

| Scope                             | Default               | Variable                                 |
| --------------------------------- | --------------------- | ---------------------------------------- |
| All `/api` routes, per IP         | 300 requests per 60 s | `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` |
| `POST /api/v1/auth/login`, per IP | 10 requests per 60 s  | `AUTH_RATE_LIMIT_MAX`                    |

Responses include the draft-7 `RateLimit` headers. When a client exceeds a limit it receives **429
`RATE_LIMITED`**.

## Pending endpoints

Each endpoint in PRD §7 is registered, with its method, path and permission, before it is built. A
pending endpoint:

1. returns 401 or 403 according to the permission matrix, then
2. returns **501 `NOT_IMPLEMENTED`** with `details.ticket`, which matches `x-ticket` in the spec.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Not implemented yet (tracked as BF-027)",
    "details": { "ticket": "BF-027" }
  }
}
```

## Implementation status

| Area                         | Endpoints                                                               | Status                                                    | Ticket(s)              |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- |
| Health                       | `GET /api/health/live`, `GET /api/health/ready`                         | Implemented                                               | BF-003                 |
| Auth                         | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`, `GET /me` | Implemented                                               | BF-002                 |
| Departments                  | `GET /departments`, `POST /departments`, `GET /departments/{id}`        | Implemented                                               | BF-009                 |
| Departments (more)           | `PATCH /departments/{id}`, cost centers, budget periods                 | Pending                                                   | BF-013, BF-014         |
| Organization and users       | `/organization`, `/users`                                               | Pending                                                   | BF-012, BF-015         |
| Purchase requests            | `/purchase-requests` and submit, revise, cancel, attachments            | Pending                                                   | BF-017, BF-018, BF-022 |
| Approvals                    | `/approvals`, `/approvals/{id}/decision`                                | Pending                                                   | BF-020                 |
| Suppliers                    | `/suppliers`, status, supplier users                                    | Pending                                                   | BF-024, BF-025         |
| RFQs                         | `/rfqs`, criteria, publish, amendments, invitations, close, demo clock  | Pending                                                   | BF-027 to BF-031       |
| Evaluation                   | `/rfqs/{id}/comparison`, evaluations, qualification, recommend-award    | Pending (engine implemented in `@bidflow/shared`, BF-008) | BF-037, BF-038, BF-040 |
| Awards                       | `/awards`, `/awards/{id}`                                               | Pending                                                   | BF-040                 |
| Supplier portal              | `/supplier/rfqs`, bids, submit, withdraw, outcome                       | Pending                                                   | BF-033 to BF-035       |
| Purchase orders and receipts | `/purchase-orders`, issue, cancel, receipts                             | Pending                                                   | BF-043 to BF-045       |
| Reports                      | `/reports/*`, CSV export                                                | Pending                                                   | BF-048, BF-049         |
| Notifications and audit      | `/notifications`, `/audit-logs`                                         | Pending                                                   | BF-050, BF-051         |
| Account                      | `/account/profile`, `/account/password`                                 | Pending                                                   | BF-052                 |

## curl examples

> The demo credentials are **development-only**. The seed creates them, they are published in the
> README, and they must never exist outside a local database:
> `admin@cedargrove.example` / `DemoPassword!2026`.

```bash
BASE=http://localhost:5172/api/v1      # or http://localhost:4102/api/v1 for the API directly
JAR=$(mktemp)

# 1. Sign in. The cookie goes to the jar; keep the CSRF token for unsafe requests.
CSRF=$(curl -s -c "$JAR" -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5172' \
  -d '{"email":"admin@cedargrove.example","password":"DemoPassword!2026"}' \
  "$BASE/auth/login" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.csrfToken')

# 2. List departments (page 1, search "eng")
curl -s -b "$JAR" "$BASE/departments?page=1&limit=25&q=eng"

# 3. Create a department. The budget is in integer minor units: 1575050 = USD 15,750.50
curl -s -b "$JAR" -X POST "$BASE/departments" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5172' \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"code":"FNB","name":"Food & Beverage","budgetPeriod":"MONTHLY","budgetMinor":1575050}'

# 4. A pending endpoint: authorized, then 501 with its ticket
curl -s -b "$JAR" "$BASE/rfqs"
# {"success":false,"data":null,"error":{"code":"NOT_IMPLEMENTED","message":"Not implemented yet (tracked as BF-027)","details":{"ticket":"BF-027"},...}}

# 5. Sign out
curl -s -b "$JAR" -X POST "$BASE/auth/logout" -H 'Origin: http://localhost:5172' -H "X-CSRF-Token: $CSRF"
```

Validate the contract after editing:

```bash
npx --yes @redocly/cli lint docs/api/openapi.yaml
```
