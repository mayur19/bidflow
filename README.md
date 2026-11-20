# BidFlow

**Procurement and supplier bidding for small and medium organizations.**
Replace email-based vendor quote collection with an auditable, repeatable purchasing workflow.

Teams raise purchase requests against department budgets, route them for approval, invite
suppliers to structured requests for quotation (RFQs), compare sealed bids transparently, approve
an award, issue purchase orders and record receipt of goods — with every decision in an
append-only audit trail. BidFlow runs entirely locally: no email, payment, ERP or other external
service is required.

> **Status:** early development. The foundation, the departments-with-budgets slice and the
> money and bid-comparison domain engine are implemented and tested (~15 % of the estimated MVP).
> Every other endpoint and screen is registered and returns its backlog ticket. See
> [docs/planning/roadmap.md](docs/planning/roadmap.md).

## Project status

| Area                                                       | Status         | Tickets         |
| ---------------------------------------------------------- | -------------- | --------------- |
| Monorepo, `run.sh`, CI, migrations, health checks          | ✅ Implemented | BF-001, BF-003  |
| Session auth (scrypt), CSRF, rate limiting                 | ✅ Implemented | BF-002          |
| PRD §3 roles and permission matrix                         | ✅ Implemented | BF-004          |
| Development seed (orgs, role logins, departments)          | ✅ Implemented | BF-005          |
| Pending API surface and navigation with tickets            | ✅ Implemented | BF-006          |
| Money: minor units, basis points, rounding, formatting     | ✅ Implemented | BF-007          |
| Bid comparison and weighted scoring engine                 | ✅ Implemented | BF-008          |
| Departments with budgets (API, screen, isolation tests)    | ✅ Implemented | BF-009 – BF-011 |
| Organization settings, cost centers, budget rollups, users | ⏳ Pending     | BF-012 – BF-015 |
| Purchase requests and approvals                            | ⏳ Pending     | BF-016 – BF-023 |
| Suppliers and RFQ events                                   | ⏳ Pending     | BF-024 – BF-032 |
| Supplier portal and bidding                                | ⏳ Pending     | BF-033 – BF-036 |
| Evaluation, comparison matrix and award                    | ⏳ Pending     | BF-037 – BF-042 |
| Purchase orders, receipts, idempotency                     | ⏳ Pending     | BF-043 – BF-047 |
| Dashboard, reports, notifications, audit viewer, account   | ⏳ Pending     | BF-048 – BF-052 |
| Full demo dataset, acceptance suite, hardening, deployment | ⏳ Pending     | BF-053 – BF-059 |

Backlog: 59 tickets, 34 h done, 196 h pending ([backlog](docs/planning/backlog.md)).

## Quick start

Requirements: Node.js ≥ 22, npm, and a running local PostgreSQL server (the current OS user must
be able to create databases).

```bash
./run.sh
```

This installs dependencies, creates `.env` from `.env.example` with a random local session secret,
creates the `bidflow_dev` database, applies migrations, seeds development data and starts:

- Web UI: <http://localhost:5172>
- API: <http://127.0.0.1:4102> (proxied by the web UI under `/api`)

## Demo logins (development only)

These accounts are created by the development seed, are public, and must never exist in a
production database (the seed refuses to run with `NODE_ENV=production`).
Password for every account: `DemoPassword!2026`

| Email                            | Role                      | Organization                                 |
| -------------------------------- | ------------------------- | -------------------------------------------- |
| `admin@cedargrove.example`       | Buyer Organization Admin  | Cedar Grove Hotels                           |
| `requester@cedargrove.example`   | Requester                 | Cedar Grove Hotels                           |
| `procurement@cedargrove.example` | Procurement Officer       | Cedar Grove Hotels                           |
| `finance@cedargrove.example`     | Approver / Finance        | Cedar Grove Hotels                           |
| `receiving@cedargrove.example`   | Receiving Clerk           | Cedar Grove Hotels                           |
| `bids@peakhvac.example`          | Supplier User (Peak HVAC) | provisioned by Cedar Grove Hotels            |
| `admin@harborview.example`       | Buyer Organization Admin  | Harborview Clinics (tenant-isolation checks) |

Seeded departments: Operations, Engineering and Housekeeping (Cedar Grove Hotels, USD);
Facilities and Clinical Supplies (Harborview Clinics, EUR). The full PRD §8 scenario (suppliers,
air-conditioning RFQ with three bids, pending award, partially received PO) is BF-053.

## Commands

| Command                       | What it does                                                               |
| ----------------------------- | -------------------------------------------------------------------------- |
| `./run.sh` / `./run.sh start` | Install deps, prepare `.env` and database, migrate, seed, launch API + web |
| `./run.sh setup`              | Everything `start` does, without launching                                 |
| `./run.sh migrate`            | Apply pending migrations                                                   |
| `./run.sh seed`               | Load development demo data (idempotent)                                    |
| `./run.sh reset [--yes]`      | Drop and recreate the schema, migrate and seed (asks first)                |
| `./run.sh test`               | Unit + integration tests against a disposable `bidflow_dev_test` database  |
| `./run.sh e2e`                | Playwright end-to-end tests                                                |
| `./run.sh check`              | Lint, format check, typecheck and tests (what CI runs)                     |
| `./run.sh build`              | Production build of API and web                                            |
| `./run.sh help`               | List commands                                                              |

## Tech stack

- **API:** Node.js 22, Express 4, PostgreSQL 17 via `pg`, zod, pino, helmet, express-rate-limit.
- **Web:** React 18, React Router 6, Vite 6.
- **Shared:** `@bidflow/shared` — zod schemas, role/permission matrix, pure domain modules
  (integer money, basis points, quantities, bid comparison and scoring).
- **Testing:** Vitest, supertest, Testing Library, Playwright; real PostgreSQL for integration tests.
- **Tooling:** TypeScript (strict), ESLint, Prettier, GitHub Actions with gitleaks.

## Repository layout

```text
bidflow/
├── apps/
│   ├── api/                  Express API (@bidflow/api)
│   │   ├── migrations/       Forward-only SQL migrations (0001, 0002)
│   │   ├── src/
│   │   │   ├── config/       Validated environment
│   │   │   ├── db/           Pool, migration runner, development seed
│   │   │   ├── lib/          Errors, envelope helpers, validation, pending routes
│   │   │   ├── middleware/   Session, CSRF, permissions, rate limit, errors
│   │   │   ├── modules/      One folder per module (departments implemented; others pending)
│   │   │   └── security/     Password hashing, tokens
│   │   └── test/             Unit, HTTP and PostgreSQL integration tests
│   └── web/                  React SPA (@bidflow/web)
│       ├── src/pages/        Login, dashboard, departments, pending placeholders
│       └── src/routes/       Navigation registry (PRD §4 screens, roles, tickets)
├── packages/shared/          @bidflow/shared: schemas, roles, domain (money, comparison)
├── e2e/                      Playwright smoke tests
├── docs/                     Product, architecture, ADRs, design, API, security, testing, ops, planning
└── run.sh                    Single local entry point
```

## Documentation

Start at [docs/README.md](docs/README.md). Highlights:
[PRD](docs/product/PRD.md) ·
[Architecture](docs/architecture/overview.md) ·
[ADRs](docs/adr/README.md) ·
[Data model](docs/design/data-model.md) ·
[API](docs/api/README.md) ·
[Threat model](docs/security/threat-model.md) ·
[Test strategy](docs/testing/test-strategy.md) ·
[Runbook](docs/operations/runbook.md) ·
[Backlog](docs/planning/backlog.md)

## Contributing, security and license

- [CONTRIBUTING.md](CONTRIBUTING.md): workflow, commit conventions, engineering rules.
- [SECURITY.md](SECURITY.md): private vulnerability reporting and secrets policy.
- [LICENSE](LICENSE): MIT.
