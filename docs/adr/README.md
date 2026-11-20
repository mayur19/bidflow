# Architecture Decision Records

Format: [MADR](https://adr.github.io/madr/). Process: [ADR-0001](0001-record-architecture-decisions.md).
Accepted ADRs describe implemented decisions; Proposed ADRs describe designs for pending tickets.

| ADR                                                          | Title                                                            | Status              |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------- |
| [0001](0001-record-architecture-decisions.md)                | Record architecture decisions                                    | Accepted            |
| [0002](0002-modular-monolith-with-npm-workspaces.md)         | Modular monolith with npm workspaces                             | Accepted            |
| [0003](0003-multi-tenancy-row-level-organization-scoping.md) | Multi-tenancy by row-level organization scoping                  | Accepted            |
| [0004](0004-postgresql-and-forward-only-sql-migrations.md)   | PostgreSQL and forward-only SQL migrations                       | Accepted            |
| [0005](0005-session-authentication-scrypt-and-csrf.md)       | Session authentication with scrypt and CSRF protection           | Accepted            |
| [0006](0006-api-conventions.md)                              | API conventions                                                  | Accepted            |
| [0007](0007-role-based-access-control.md)                    | Role-based access control and permission matrix                  | Accepted            |
| [0008](0008-append-only-audit-trail.md)                      | Append-only audit trail                                          | Accepted            |
| [0009](0009-configuration-and-secrets-management.md)         | Configuration and secrets management                             | Accepted            |
| [0010](0010-testing-strategy.md)                             | Testing strategy                                                 | Accepted            |
| [0011](0011-local-file-attachment-storage.md)                | Local file attachment storage                                    | Proposed            |
| [0012](0012-in-app-notifications-and-background-worker.md)   | In-app notifications and background worker                       | Proposed            |
| [0013](0013-integer-money-basis-points-and-rounding.md)      | Integer money, basis points and a single rounding rule           | Accepted            |
| [0014](0014-bid-comparison-and-scoring-model.md)             | Bid comparison and scoring model                                 | Accepted            |
| [0015](0015-supplier-portal-isolation-and-sealed-bids.md)    | Supplier portal isolation and sealed-bid visibility              | Accepted / Proposed |
| [0016](0016-approval-routing-and-segregation-of-duties.md)   | Approval routing and segregation of duties                       | Proposed            |
| [0017](0017-procurement-lifecycle-state-machines.md)         | Procurement lifecycle state machines                             | Proposed            |
| [0018](0018-budget-commitment-control.md)                    | Budget commitment control preventing over-budget purchase orders | Proposed            |

## Writing a new ADR

1. Copy the structure of an existing ADR (Title, Status, Date, Context, Decision Drivers,
   Considered Options, Decision Outcome with Consequences, Links).
2. Use the next number; never renumber.
3. To change an accepted decision, write a new ADR and mark the old one
   `Superseded by ADR-NNNN`.
