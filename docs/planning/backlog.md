# Backlog

Every ticket is 1–6 hours of focused work. Status: ✅ Done / ⏳ Pending. The machine-readable
copy is [`backlog.json`](backlog.json) (same tickets, used to create GitHub issues). Milestones and
sequencing are in [`roadmap.md`](roadmap.md); requirement coverage is in
[`../product/requirements-traceability.md`](../product/requirements-traceability.md).

## Milestones

- **M0: Foundation** (6 tickets, 17 h, 17 h done): Monorepo, launcher, authentication, sessions, CSRF, migrations, audit table, actor model, pending API surface and development seed.
- **M1: Organization, budgets and domain core** (9 tickets, 33 h, 17 h done): Departments with budgets, organization settings, integer money and the bid comparison engine that later milestones build on.
- **M2: Purchase requests and approvals** (8 tickets, 33 h, 0 h done): Purchase request lifecycle, immutable revisions, threshold-based approval routing, no-self-approval and attachments.
- **M3: Suppliers and RFQ events** (9 tickets, 35 h, 0 h done): Supplier directory, supplier logins, RFQ creation from approved requests, criteria, publish/freeze, invitations and server-side deadlines.
- **M4: Supplier portal and bidding** (4 tickets, 17 h, 0 h done): Isolated supplier portal, sealed bid drafts and revisions, deadline-safe submission and withdrawal.
- **M5: Evaluation and award** (6 tickets, 26 h, 0 h done): Comparison matrix on persisted bids, evaluator scoring, disqualification, award recommendation and finance approval with snapshots.
- **M6: Purchase orders and receiving** (5 tickets, 20 h, 0 h done): PO issue with budget commitment control, print-ready PO, partial receipts, over-receipt rejection and idempotent financial POSTs.
- **M7: Reporting, notifications and governance** (5 tickets, 19 h, 0 h done): Dashboard, spend and supplier reports, CSV export, in-app notifications, audit log viewer and account settings.
- **M8: Acceptance and hardening** (7 tickets, 30 h, 0 h done): Full PRD §8 demo dataset, Playwright acceptance suite B-01..B-18, security and accessibility verification, deployment pipeline.

## Tickets

| ID     | Title                                                                     | Milestone | PRD refs                                             | Estimate (h) | Status     | Depends on     |
| ------ | ------------------------------------------------------------------------- | --------- | ---------------------------------------------------- | -----------: | ---------- | -------------- |
| BF-001 | Set up monorepo, run.sh launcher and CI pipeline                          | M0        | §2, §10                                              |            4 | ✅ Done    | —              |
| BF-002 | Implement session authentication with scrypt, CSRF and rate limiting      | M0        | §2, §3, §11                                          |            4 | ✅ Done    | BF-001         |
| BF-003 | Add migration runner, append-only audit table and health checks           | M0        | FR-10, §2                                            |            3 | ✅ Done    | BF-001         |
| BF-004 | Define buyer actor model and RBAC permission matrix                       | M0        | §3                                                   |            2 | ✅ Done    | BF-002         |
| BF-005 | Seed development organizations, role logins and departments               | M0        | §8, FR-01                                            |            2 | ✅ Done    | BF-004         |
| BF-006 | Register pending API surface and navigation with ticket ids               | M0        | §4, §7                                               |            2 | ✅ Done    | BF-004         |
| BF-007 | Build money module: minor units, basis points, rounding and formatting    | M1        | §2, FR-06, FR-08                                     |            4 | ✅ Done    | BF-001         |
| BF-008 | Build bid comparison and weighted scoring engine                          | M1        | FR-06, FR-07, B-09, B-10, B-11                       |            5 | ✅ Done    | BF-007         |
| BF-009 | Implement departments with budgets API (list, create, get)                | M1        | FR-01, B-18                                          |            4 | ✅ Done    | BF-004, BF-007 |
| BF-010 | Build departments and budgets screen                                      | M1        | FR-01, §4.3                                          |            2 | ✅ Done    | BF-009         |
| BF-011 | Prove department tenant isolation and RBAC against PostgreSQL             | M1        | FR-01, B-18                                          |            2 | ✅ Done    | BF-009         |
| BF-012 | Implement organization settings: currency, timezone, approval threshold   | M1        | FR-01                                                |            3 | ⏳ Pending | BF-009         |
| BF-013 | Add department update/deactivate and cost centers                         | M1        | FR-01                                                |            4 | ⏳ Pending | BF-009         |
| BF-014 | Add budget periods and requested/approved/committed rollups               | M1        | FR-01                                                |            5 | ⏳ Pending | BF-013         |
| BF-015 | Implement user and department membership administration                   | M1        | §3, FR-01                                            |            4 | ⏳ Pending | BF-004         |
| BF-016 | Create purchase request schema, codes and line items                      | M2        | FR-02                                                |            4 | ⏳ Pending | BF-009         |
| BF-017 | Build purchase request create, list and detail API                        | M2        | FR-02, B-01                                          |            4 | ⏳ Pending | BF-016, BF-015 |
| BF-018 | Implement submit, revise and cancel with immutable revisions              | M2        | FR-02, B-01                                          |            4 | ⏳ Pending | BF-017         |
| BF-019 | Build approval routing rules for manager and over-threshold finance steps | M2        | FR-02, B-03                                          |            4 | ⏳ Pending | BF-018, BF-012 |
| BF-020 | Implement approvals inbox and decision API with no-self-approval          | M2        | FR-02, FR-07, B-02, B-03                             |            4 | ⏳ Pending | BF-019         |
| BF-021 | Build purchase request list, editor and detail timeline screens           | M2        | FR-02, §4.4, §4.5, §4.6                              |            6 | ⏳ Pending | BF-018         |
| BF-022 | Store attachments on local disk with type and size limits                 | M2        | FR-02, FR-05, §2                                     |            4 | ⏳ Pending | BF-017         |
| BF-023 | Build approvals inbox screen                                              | M2        | FR-02, FR-07, §4.2, §4.14                            |            3 | ⏳ Pending | BF-020         |
| BF-024 | Implement supplier directory API with activate/deactivate                 | M3        | FR-03                                                |            4 | ⏳ Pending | BF-009         |
| BF-025 | Provision supplier logins and supplier memberships                        | M3        | FR-03, §2                                            |            4 | ⏳ Pending | BF-024         |
| BF-026 | Build supplier directory screen                                           | M3        | FR-03, §4.7                                          |            3 | ⏳ Pending | BF-024         |
| BF-027 | Create RFQs from approved requests with line snapshots                    | M3        | FR-04                                                |            4 | ⏳ Pending | BF-018, BF-024 |
| BF-028 | Configure evaluation criteria and block invalid weights on publish        | M3        | FR-04, FR-06, B-09                                   |            3 | ⏳ Pending | BF-027, BF-008 |
| BF-029 | Publish RFQs, freeze requirements and handle amendments                   | M3        | FR-04, B-04                                          |            4 | ⏳ Pending | BF-028         |
| BF-030 | Manage RFQ invitations and invitation states                              | M3        | FR-04, B-04                                          |            3 | ⏳ Pending | BF-029, BF-025 |
| BF-031 | Enforce RFQ deadlines server-side with manual close and demo clock        | M3        | FR-04, B-08                                          |            4 | ⏳ Pending | BF-029         |
| BF-032 | Build RFQ list, creation wizard and detail screens                        | M3        | FR-04, §4.8, §4.9, §4.10                             |            6 | ⏳ Pending | BF-030, BF-031 |
| BF-033 | Enforce supplier portal isolation and record-level guards                 | M4        | FR-03, FR-05, B-05, B-06                             |            4 | ⏳ Pending | BF-030         |
| BF-034 | Implement supplier bid drafts and revisions                               | M4        | FR-05, B-07                                          |            4 | ⏳ Pending | BF-033         |
| BF-035 | Implement bid submit and withdraw with deadline checks                    | M4        | FR-05, B-07, B-08                                    |            3 | ⏳ Pending | BF-034, BF-031 |
| BF-036 | Build supplier portal screens: invitations and response form              | M4        | FR-05, §4.11, §4.12                                  |            6 | ⏳ Pending | BF-035, BF-022 |
| BF-037 | Wire persisted bids into the comparison endpoint                          | M5        | FR-06                                                |            4 | ⏳ Pending | BF-035, BF-008 |
| BF-038 | Implement evaluator scoring and disqualification API                      | M5        | FR-06, B-10                                          |            4 | ⏳ Pending | BF-037         |
| BF-039 | Build bid comparison matrix screen                                        | M5        | FR-06, §4.13                                         |            5 | ⏳ Pending | BF-038         |
| BF-040 | Record award recommendations with bid and score snapshots                 | M5        | FR-06, FR-07, B-11                                   |            4 | ⏳ Pending | BF-038         |
| BF-041 | Approve awards and create the PO draft exactly once                       | M5        | FR-07, B-12, B-17                                    |            5 | ⏳ Pending | BF-040, BF-020 |
| BF-042 | Build award recommendation and approval screen                            | M5        | FR-07, §4.14                                         |            4 | ⏳ Pending | BF-041         |
| BF-043 | Issue purchase orders with budget commitment control                      | M6        | FR-08, B-13, Goal 5                                  |            5 | ⏳ Pending | BF-041, BF-014 |
| BF-044 | Build purchase order list/detail API and print-ready PO                   | M6        | FR-08, §4.15                                         |            4 | ⏳ Pending | BF-043         |
| BF-045 | Record receipts with partial delivery and over-receipt rejection          | M6        | FR-08, B-14, B-15, B-17                              |            5 | ⏳ Pending | BF-043         |
| BF-046 | Build receipts screen                                                     | M6        | FR-08, §4.16                                         |            3 | ⏳ Pending | BF-045         |
| BF-047 | Add idempotency keys for financial POST endpoints                         | M6        | FR-10, B-17                                          |            3 | ⏳ Pending | BF-003         |
| BF-048 | Build buyer dashboard API and screen                                      | M7        | FR-09, §4.2                                          |            5 | ⏳ Pending | BF-045         |
| BF-049 | Build spend and supplier performance reports with CSV export              | M7        | FR-09, §4.17                                         |            5 | ⏳ Pending | BF-045         |
| BF-050 | Deliver in-app notifications and background worker                        | M7        | FR-09, §4.18                                         |            4 | ⏳ Pending | BF-029, BF-041 |
| BF-051 | Build audit log API and viewer                                            | M7        | FR-10, §4.18                                         |            3 | ⏳ Pending | BF-003         |
| BF-052 | Build account settings screen                                             | M7        | §4.18                                                |            2 | ⏳ Pending | BF-002         |
| BF-053 | Seed the full PRD §8 demonstration dataset                                | M8        | §8                                                   |            4 | ⏳ Pending | BF-045, BF-050 |
| BF-054 | Automate acceptance tests B-01 to B-04 in Playwright                      | M8        | B-01, B-02, B-03, B-04                               |            4 | ⏳ Pending | BF-053         |
| BF-055 | Automate acceptance tests B-05 to B-09 in Playwright                      | M8        | B-05, B-06, B-07, B-08, B-09                         |            5 | ⏳ Pending | BF-053         |
| BF-056 | Automate acceptance tests B-10 to B-18 in Playwright                      | M8        | B-10, B-11, B-12, B-13, B-14, B-15, B-16, B-17, B-18 |            6 | ⏳ Pending | BF-053         |
| BF-057 | Run tenant-isolation sweep and ASVS L2 security verification              | M8        | B-18, §11                                            |            4 | ⏳ Pending | BF-056         |
| BF-058 | Accessibility and responsive supplier portal pass                         | M8        | §4                                                   |            3 | ⏳ Pending | BF-036, BF-039 |
| BF-059 | Build production container image and deployment pipeline                  | M8        | §2                                                   |            4 | ⏳ Pending | BF-001         |

## Totals

| Measure       |                    Value |
| ------------- | -----------------------: |
| Tickets       | 59 (11 done, 48 pending) |
| Done hours    |                       34 |
| Pending hours |                      196 |
| Total hours   |                      230 |
| Complete      |                   14.8 % |

Estimates exclude code review and release overhead. Re-estimate a ticket when it is picked up if
its scope changed; never split a ticket's acceptance criteria across releases silently.
