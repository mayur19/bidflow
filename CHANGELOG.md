# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Monorepo foundation: Express + PostgreSQL API, React + Vite web, `@bidflow/shared` package (BF-001).
- Single launcher `run.sh` (setup, migrate, seed, reset, start, test, e2e, check, build).
- Session authentication with scrypt hashing, HMAC CSRF tokens, Origin checks and login rate limiting (BF-002).
- Forward-only migration runner, append-only `audit_events`, liveness and readiness endpoints (BF-003).
- PRD §3 actor model (Buyer Admin, Requester, Procurement Officer, Approver/Finance, Receiving Clerk,
  Supplier User), shared permission matrix and database role CHECK constraint (BF-004).
- Development-only seed for Cedar Grove Hotels and Harborview Clinics with one login per role (BF-005).
- Full PRD §7 API surface registered with permissions; unbuilt endpoints return 501 with ticket ids;
  navigation for every PRD §4 screen with role visibility (BF-006).
- Money module: integer minor units, basis points, milli-unit quantities, ROUND HALF UP rule,
  overflow guards, float-free parsing and formatting (BF-007).
- Bid comparison engine: line and bid totals, lowest-priced vs lowest qualified bid, FR-06 price
  normalization, weighted qualitative scores, deterministic ranking and recommendation checks (BF-008).
- Departments with budgets: tenant-scoped list/create/get API with pagination, search, audit and
  organization currency (BF-009); departments screen with create form (BF-010); PostgreSQL
  integration tests for tenant isolation and RBAC (BF-011).
- Engineering documentation: PRD, user stories, traceability, architecture, quality attributes,
  ADR-0001 to ADR-0018, system design, data model, OpenAPI contract, threat model, test strategy,
  runbook, deployment plan, roadmap, backlog and risk register.
