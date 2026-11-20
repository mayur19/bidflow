# Quality attributes

Measurable non-functional requirements for BidFlow. Targets apply to the MVP reference
deployment: one API instance (2 vCPU, 2 GB RAM), managed PostgreSQL, up to 50 buyer
organizations, 500 active users and 200 open RFQs. Status: ✅ met and verified today,
⏳ planned (verifying ticket in [`../planning/backlog.md`](../planning/backlog.md)).

## Security

| ID     | Requirement                        | Target                                                                                         | Status                           | Verified by                                                 |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| SEC-1  | Tenant isolation                   | Zero cross-organization reads or writes; foreign ids return 404 with no payload                | ✅ departments; ⏳ all endpoints | `departments.db.test.ts`; BF-057 sweep, BF-056 (B-18)       |
| SEC-2  | Authorization enforced server-side | Every route has an explicit permission; UI hiding is never the control                         | ✅                               | `pending-routes.http.test.ts`, `department.service.test.ts` |
| SEC-3  | Supplier confidentiality           | Suppliers never receive competitor identities, scores, budgets or sealed bids                  | ⏳                               | BF-033, BF-055 (B-05, B-06)                                 |
| SEC-4  | Password storage                   | scrypt N=32768, r=8, p=1, 16-byte salt; minimum 12 characters                                  | ✅                               | `password.test.ts`                                          |
| SEC-5  | Session security                   | 256-bit tokens, only SHA-256 stored, HttpOnly + SameSite=Lax (+ Secure in production), 8 h TTL | ✅                               | `integration.db.test.ts`                                    |
| SEC-6  | CSRF                               | Unsafe requests require matching Origin and HMAC token                                         | ✅                               | `app.http.test.ts`, `integration.db.test.ts`                |
| SEC-7  | Brute-force resistance             | Login limited to 10 requests/min per client; generic error for all failures                    | ✅                               | `auth.service.test.ts`                                      |
| SEC-8  | No secrets in repository           | gitleaks clean; `.env` untracked; placeholder secret rejected in production                    | ✅                               | CI `secrets-scan`, `env.test.ts`                            |
| SEC-9  | Dependency hygiene                 | No known high/critical advisories at release                                                   | ⏳                               | BF-057                                                      |
| SEC-10 | ASVS                               | OWASP ASVS 4.0 Level 2 for authentication, session, access control, validation                 | ⏳                               | BF-057, [threat model](../security/threat-model.md)         |

## Performance

Measured server-side (request received → response sent), excluding network, with warm caches.

| ID     | Operation                                                        | p95 target      | p99 target | Status                                         | Verified by              |
| ------ | ---------------------------------------------------------------- | --------------- | ---------- | ---------------------------------------------- | ------------------------ |
| PERF-1 | Paginated list endpoints (≤100 rows), e.g. `GET /departments`    | ≤ 200 ms        | ≤ 400 ms   | ✅ (single-digit ms locally)                   | ⏳ load script in BF-057 |
| PERF-2 | Detail endpoints (`GET /…/:id`)                                  | ≤ 150 ms        | ≤ 300 ms   | ✅ departments                                 | BF-057                   |
| PERF-3 | Bid comparison, 20 bids × 200 lines × 5 criteria                 | ≤ 300 ms        | ≤ 600 ms   | ⏳ engine is O(bids × lines); endpoint pending | BF-037                   |
| PERF-4 | State-changing transactions (submit, approve, issue PO, receipt) | ≤ 300 ms        | ≤ 800 ms   | ⏳                                             | BF-045, BF-057           |
| PERF-5 | Login (dominated by scrypt)                                      | ≤ 400 ms        | ≤ 700 ms   | ✅                                             | manual timing            |
| PERF-6 | SPA initial load on broadband, production build                  | ≤ 2.5 s LCP     | —          | ⏳                                             | BF-058                   |
| PERF-7 | CSV export of 10 000 rows                                        | ≤ 3 s, streamed | —          | ⏳                                             | BF-049                   |

## Availability and reliability

| ID   | Requirement                             | Target                                                                                                 | Status                        | Verified by                                    |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------- |
| AV-1 | Monthly availability (production)       | 99.5 % (≈ 3.6 h downtime/month)                                                                        | ⏳                            | [deployment plan](../operations/deployment.md) |
| AV-2 | Health endpoints                        | `/api/health/live` never touches dependencies; `/api/health/ready` returns 503 when PostgreSQL is down | ✅                            | `app.http.test.ts`                             |
| AV-3 | Graceful shutdown                       | In-flight requests drain within 10 s on SIGTERM                                                        | ✅                            | `src/index.ts`                                 |
| AV-4 | Durability of financial records         | Bids, scores, POs and receipts survive restart (B-16)                                                  | ✅ storage model; ⏳ scenario | BF-056                                         |
| AV-5 | No duplicate financial records on retry | Duplicate POST for award/receipt produces one record (B-17)                                            | ⏳                            | BF-041, BF-045, BF-047                         |
| AV-6 | Zero-downtime deploys                   | Expand/contract migrations; rolling restart                                                            | ⏳                            | BF-059                                         |

## Scalability

| ID   | Requirement            | Target                                                                         | Status                                                                                   |
| ---- | ---------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| SC-1 | Horizontal API scaling | API is stateless (sessions in PostgreSQL); N instances behind a proxy          | ✅ by design                                                                             |
| SC-2 | Data volume            | 1 M purchase-request lines and 5 M audit events without breaching PERF targets | ⏳ indexing plan in [system design](../design/system-design.md#performance-and-indexing) |
| SC-3 | Connection budget      | ≤ 10 pooled connections per API instance (`DATABASE_POOL_MAX`)                 | ✅                                                                                       |
| SC-4 | Worker singleton       | Exactly one active worker per environment via PostgreSQL advisory lock         | ⏳ BF-050                                                                                |

## Observability

| ID    | Requirement              | Target                                                                                         | Status                                  |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| OBS-1 | Structured logs          | JSON (pino), one line per request with method, path, status, latency, request id               | ✅                                      |
| OBS-2 | Correlation              | `X-Request-Id` echoed in responses, error bodies and audit rows                                | ✅                                      |
| OBS-3 | Sensitive data redaction | Cookies, authorization, CSRF header, password fields redacted                                  | ✅                                      |
| OBS-4 | Metrics                  | RED metrics per route and pool saturation exported to the platform stack                       | ⏳ BF-059                               |
| OBS-5 | Alerting                 | Page on readiness failure > 2 min or 5xx rate > 2 % for 5 min                                  | ⏳ BF-059                               |
| OBS-6 | Business audit           | Every state change in FR-10 has an audit event with actor, organization, entity and request id | ✅ departments, login; ⏳ other modules |

## Accessibility and usability

| ID     | Requirement                | Target                                                                     | Status                       | Verified by             |
| ------ | -------------------------- | -------------------------------------------------------------------------- | ---------------------------- | ----------------------- |
| A11Y-1 | Conformance                | WCAG 2.1 AA on all screens                                                 | ⏳                           | BF-058 (axe + keyboard) |
| A11Y-2 | Keyboard                   | Every action reachable by keyboard with visible focus (3 px outline)       | ✅ shell, login, departments | BF-058                  |
| A11Y-3 | Semantics                  | Labelled form fields, table captions, `role="alert"`/`status` for messages | ✅ implemented screens       | Playwright role queries |
| A11Y-4 | Responsive supplier portal | Usable at 360 px width                                                     | ⏳                           | BF-036, BF-058          |
| A11Y-5 | Missing data               | Shown as `Not available`, never invented values (FR-09)                    | ⏳                           | BF-048, BF-049          |

## Data integrity, retention and recovery

| ID   | Requirement                  | Target                                                                                              | Status                                         |
| ---- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| DI-1 | Money correctness            | No floating-point money; one rounding rule; overflow rejected                                       | ✅ ADR-0013, 100 % domain branch coverage      |
| DI-2 | Constraint enforcement       | Roles, money ranges, codes and uniqueness enforced by PostgreSQL CHECK/UNIQUE as well as the API    | ✅ 0002                                        |
| DI-3 | Audit retention              | Audit events retained 7 years; append-only (no UPDATE/DELETE grants for the app role in production) | ✅ table; ⏳ grants BF-059                     |
| DI-4 | Procurement record retention | Requests, RFQs, bids, awards, POs, receipts retained 7 years; soft-deactivation only                | ⏳                                             |
| DI-5 | Session retention            | Expired sessions swept every 15 min                                                                 | ✅                                             |
| DI-6 | Attachments                  | Retained with their parent record; orphan cleanup job                                               | ⏳ BF-022                                      |
| DI-7 | Backup                       | Daily full backup + continuous WAL archiving; backups encrypted, 35-day retention                   | ⏳ BF-059                                      |
| DI-8 | Recovery objectives          | RPO ≤ 15 min, RTO ≤ 4 h; restore drill quarterly                                                    | ⏳ BF-059, [runbook](../operations/runbook.md) |
