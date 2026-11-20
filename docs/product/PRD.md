# BidFlow — Procurement & Supplier Bidding SaaS

**Document type:** Implementation-ready product requirements document (PRD)  
**Version:** 1.0 · 20 November 2026  
**Delivery target:** Working MVP (see docs/planning/roadmap.md for phased estimates).  
**Primary delivery:** A working, multi-role procurement web application with realistic seeded RFQs and verified workflows.

## 1. Product brief

BidFlow is a lightweight sourcing and procurement workspace for small and medium organizations. Teams raise purchase requests, approve budgets, invite suppliers, run structured request-for-quotation (RFQ) events, compare quotes transparently, choose an award, issue purchase orders and record receipt of goods/services.

**One-sentence promise:** Replace email-based vendor quote collection with an auditable, repeatable purchasing workflow.

**Primary buyer:** Procurement/operations lead at a manufacturer, hotel group, clinic chain or other SMB with repeat supplier purchases and nontrivial internal approvals.  
**Existing commercial category:** Procurement suites such as Tradogram and Precoro. Market existence does not prove demand for a new entrant.  
**Indicative pricing hypothesis:** $79 per buyer organization per month for a limited number of sourcing events, with higher plans for multiple departments.

### Goals

1. Every purchase has an owner, budget source and documented approval decision.
2. Suppliers submit comparable responses through a restricted portal.
3. Decision makers see an objective price comparison plus recorded qualitative scores.
4. Award and purchase-order terms are traceable back to the original bid.
5. Unapproved or over-budget purchases cannot silently become purchase orders.
6. The entire end-to-end lifecycle is demonstrable without email, payment or ERP APIs.

### Explicit non-goals

No live government tender feed, supplier discovery marketplace, e-signature, bank/payment rails, accounting/ERP sync, automated tax compliance, vendor KYC verification, external email delivery, real-time currency exchange, automated award decisions, or legally binding electronic contracting.

## 2. Sandbox and technical contract

- Run on Linux, Node.js 22, Chrome and Playwright with **no runtime internet**, Docker, GPU, apt-get or external APIs.
- Use React + Vite, Node.js + Express and local PostgreSQL via `pg`; a verified SQLite fallback is acceptable. Everything must be installed only from the available npm mirror or existing local executables.
- Authentication and authorization live in the application. All sessions, attachments, bids, approvals, alerts and audit data persist locally.
- Supplier invitations are simulated as **portal invitations** created in-app: an admin provisions a supplier login and records its invitation in the database. Do not pretend invitation emails were sent.
- Use integer minor units for monetary calculations, basis points for percentage rates, and a fixed RFQ currency. No floating-point pricing arithmetic.
- Files are on local disk with strict type/size limits; SQL stores metadata. CSV export and print-friendly purchase orders work locally.
- All sample data and dependencies must be packaged or seeded. No CDN fonts/icons, remote images, hosted UI kits or payment integration.
- Provide migration, seed, reset, test and start commands; local service startup must be documented.

## 3. Roles and visibility boundaries

| Role                     | Principal permissions                                                                       | Key restrictions                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Buyer Organization Admin | Organization settings, users, departments, thresholds, all procurement records              | No access to other buyer organizations                                 |
| Requester                | Create purchase requests, upload specifications, follow status                              | Cannot approve own requests or see sealed supplier quotes              |
| Procurement Officer      | Create and publish RFQs, manage suppliers, view comparative bids after close, draft awards  | Cannot override required purchasing approval                           |
| Approver / Finance       | Approve/reject requests, budget exceptions and awards; see committed spend                  | Cannot alter submitted supplier bids                                   |
| Supplier User            | View only assigned invitations, submit/edit own bid before deadline, read own award outcome | Cannot see competing suppliers, internal scores, budgets or other RFQs |
| Receiving Clerk          | Record deliveries against issued POs                                                        | Cannot change RFQ or commercial award terms                            |

A buyer organization can have many supplier organizations. Supplier membership is independent of buyer membership. Enforce record-level access in every API method.

## 4. Required pages and navigation

1. Login and role-based landing page.
2. Buyer dashboard: pending approvals, active RFQs, committed spend, late deliveries.
3. Organization, departments and budget settings.
4. Purchase request list with filters.
5. Purchase request creation and line-item editor.
6. Purchase request detail, attachments and approval timeline.
7. Supplier directory and vendor status.
8. RFQ list, stage tabs and search.
9. RFQ creation wizard: scope, lines, suppliers, criteria and deadline.
10. Published RFQ detail with invitation states.
11. Supplier portal: invited RFQ list.
12. Supplier response form with per-line price, lead time and document attachments.
13. Bid comparison matrix with normalized price and qualitative scoring.
14. Award recommendation and approval detail.
15. Purchase orders list and print-ready PO detail.
16. Receipts: items received, partial and outstanding quantities.
17. Spend and supplier performance reports.
18. Audit log, notification inbox and account settings.

Include usable empty/error states, search/filter/sort, confirmation before irreversible events, and a responsive interface for supplier access on smaller screens.

## 5. Functional requirements

### FR-01 — Organization, departments and budgets (P0)

- Organization has one default currency, timezone and spend-approval threshold.
- CRUD departments and cost centers with monthly/quarterly budgets set by admins.
- Budget is **planning/approval control**, not a full accounting ledger. Show requested, approved and committed amounts with definitions.
- Ensure organization scoping in every query and authorized department membership on each request.

### FR-02 — Purchase requests (P0)

- Request contains department, requester, purpose, needed-by date, currency, supplier preference (optional), line items (description, category, quantity, unit), attachments and estimated budget.
- Lifecycle: `DRAFT → SUBMITTED → APPROVED / REJECTED → SOURCING → AWARDED → ORDERED → RECEIVED`; allow `CANCELLED` with an explicit reason where legally/process appropriate.
- Approval rules: an initial request may require department manager approval; over-threshold requests require finance approval.
- Requester cannot self-approve. Editing after submission creates a revised draft requiring resubmission; existing decision history remains.
- Validate nonzero positive quantities and a purchase description; generate unique request codes scoped to buyer organization.

### FR-03 — Supplier directory and restricted access (P0)

- Supplier profile: organization name, contact name, email, categories, tax-registration text (not verified), country, status, performance notes.
- Suppliers have separate login(s) and can only access explicitly invited RFQs.
- Buyer can activate/deactivate a supplier; deactivation blocks new responses while preserving existing submissions for audit.
- Supplier portal must not reveal competitors' identities or responses prior to or after close unless explicitly permitted by a future feature (not MVP).

### FR-04 — RFQ events (P0)

- Procurement officer creates RFQ from an approved purchase request; default lines are snapshotted and can be clarified before publication.
- Configure deadline, evaluation criteria, weights, terms, expected delivery window, attachment requirements and invited suppliers.
- Lifecycle: `DRAFT → PUBLISHED → CLOSED → EVALUATING → AWARD_PENDING → AWARDED` or `CANCELLED`.
- Publishing freezes commercial line definitions; any material amendment requires creating a new revision and notifying invitees **in-app**. No silent edits to published requirements.
- Deadline is enforced server-side using UTC with a display timezone; late submissions are rejected. Buyer may manually close early with a reason, recorded in audit history.
- Allow a buyer-side demo action to advance simulated deadlines for automated tests, but production behavior relies on server clock.

### FR-05 — Supplier bid submission (P0)

- Supplier completes all mandatory RFQ lines: quoted unit price, quantity confirmation, delivery lead time, technical compliance, optional qualification notes and attachments.
- Support save draft and submit. One current bid per supplier/RFQ; edits before deadline create new revisions, preserving previous versions.
- Submitted bids become read-only at close. Supplier can withdraw before close; withdrawn bids cannot win.
- Validate numeric price and required details, upload size/type, and prevent manual API calls from submitting another supplier's bid.
- Do not email invitations; notifications are confined to in-app inboxes and dashboard cards.

### FR-06 — Comparison and evaluation engine (P0)

- Comparison grid displays qualified suppliers as columns and RFQ lines as rows, with total pre-tax cost and delivery lead time.
- **Fixed currency per RFQ.** For MVP, reject cross-currency bids; do not invent FX conversion.
- Price score formula: `price_points = (lowest_qualified_bid_total / this_bid_total) × price_weight` (for positive totals), computed with safe integer/decimal arithmetic and rounded only for display.
- Non-price criteria (e.g., compliance, delivery, quality) are scored 0–100 by a buyer evaluator; multiply each percentage by its configured weight.
- Weights must total 100%. One price criterion plus multiple qualitative criteria. Disqualified bids are excluded from price normalization and cannot win until disqualification is cleared with a reason.
- Score is decision support, **not automatic award**. Final evaluation includes comments and evidence.
- Preserve bid, criteria and score snapshots on award so later configuration changes do not rewrite history.

### FR-07 — Award recommendation and approval (P0)

- Procurement officer recommends a single supplier for **all RFQ lines** in MVP (no split awards).
- Recommendation records reasoning, comparative scores, selected bid version, total cost, delivery promise and any deviation from top-ranked supplier.
- Approval threshold, over-budget condition or non-top-scoring award triggers finance approval.
- Approver can approve/reject/request clarification; no self-approval by recommendation author.
- On approved award, system generates a PO draft using a transaction-safe snapshot of terms.

### FR-08 — Purchase orders and receipts (P0)

- Purchase order includes buyer, supplier, organization-specific PO number, lines, prices, quantities, currency, approval references, delivery address and terms.
- Lifecycle: `DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED` and `CANCELLED` only with an audit reason.
- Once issued, price/line data are immutable; changes require a recorded revision or cancellation/reissue.
- Receiving clerk enters receipt per line: received quantity, date, notes and optional evidence.
- Cumulative received quantity cannot exceed ordered quantity without a separate over-receipt approval feature (excluded from MVP).
- Partial receipts update outstanding counts and dashboard indicators.

### FR-09 — Reports and notifications (P0)

- Dashboard: total approved requests, RFQs closing soon, pending approvals, active POs, outstanding receipts, committed purchase value.
- Reports: spend by department/category/supplier, average number of bids per RFQ, RFQ cycle time, delivery punctuality where data exists.
- Display missing data as `Not available`, not invented percentages.
- CSV export of authorized filtered purchase requests, comparisons and PO report data.
- In-app alerts: requested approval, RFQ published, bid submitted, RFQ closing, award decided, delivery overdue.

### FR-10 — Audit and governance (P0)

- Append-only event log for request state, RFQ publication, bid submission/version, evaluation, disqualification, award approval, PO issue and receipts.
- Include actor, organization, entity, event type, timestamp and relevant snapshot hashes/details.
- All form submissions idempotent where duplicates would cause financial issues (approval, issue PO, receipt).

## 6. Data model (minimum tables)

- `buyer_organizations`, `users`, `buyer_memberships`, `departments`, `cost_centers`, `budgets`
- `supplier_organizations`, `supplier_users`, `supplier_memberships`, `supplier_contacts`
- `purchase_requests(id, buyer_org_id, department_id, requester_id, code, status, estimated_total_minor, currency, needed_by, version, created_at)`
- `purchase_request_lines(id, buyer_org_id, request_id, description, unit, qty_decimal, estimated_unit_minor)`
- `approval_steps(id, buyer_org_id, subject_type, subject_id, step_order, required_role, status, decided_by, decided_at, reason)`
- `rfqs(id, buyer_org_id, request_id, code, status, currency, deadline_at, revision, published_at, closed_at)`
- `rfq_lines(id, buyer_org_id, rfq_id, description, unit, qty_decimal, spec_json, sort_order)`
- `rfq_invitations(id, buyer_org_id, rfq_id, supplier_org_id, status, UNIQUE(rfq_id,supplier_org_id))`
- `evaluation_criteria(id, buyer_org_id, rfq_id, label, category, weight_bps, sort_order)`
- `supplier_bids(id, buyer_org_id, rfq_id, supplier_org_id, revision, status, submitted_at, notes)`
- `supplier_bid_lines(id, buyer_org_id, bid_id, rfq_line_id, unit_price_minor, lead_days, compliant, notes)`
- `evaluation_scores(id, buyer_org_id, rfq_id, bid_id, criterion_id, score_0_to_100, evaluator_id, rationale)`
- `bid_qualifications(id, buyer_org_id, bid_id, qualified, decision_reason, decided_by)`
- `award_recommendations(id, buyer_org_id, rfq_id, bid_id, evaluator_id, status, justification, award_snapshot_json)`
- `purchase_orders(id, buyer_org_id, award_id, supplier_org_id, po_code, status, total_minor, currency, issued_at, terms_snapshot_json, version)`
- `purchase_order_lines(id, buyer_org_id, purchase_order_id, rfq_line_id, quantity, unit_price_minor)`
- `receipts(id, buyer_org_id, purchase_order_id, recorded_by, received_at, note)`
- `receipt_lines(id, buyer_org_id, receipt_id, purchase_order_line_id, qty_received)`
- `attachments`, `notifications`, `audit_logs`

Use numeric/decimal quantity where fractional units are possible, minor currency units for money, indexes on organization, status and date, and SQL transactions for award/PO/receipt invariants. Prevent sensitive supplier bids from appearing in broad list queries before close.

## 7. Suggested API resources

- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Purchase requests: `/api/purchase-requests`, `/api/purchase-requests/:id/submit`, `/api/purchase-requests/:id/revise`
- Approvals: `/api/approvals`, `/api/approvals/:id/decision`
- Suppliers: `/api/suppliers`, `/api/suppliers/:id`, `/api/suppliers/:id/users`
- RFQs: `/api/rfqs`, `/api/rfqs/:id/publish`, `/api/rfqs/:id/close`, `/api/rfqs/:id/invitations`
- Supplier portal: `/api/supplier/rfqs`, `/api/supplier/rfqs/:id/bid`, `/api/supplier/bids/:id/submit`
- Evaluation: `/api/rfqs/:id/comparison`, `/api/rfqs/:id/evaluations`, `/api/rfqs/:id/recommend-award`
- Purchase orders: `/api/purchase-orders`, `/api/purchase-orders/:id/issue`, `/api/purchase-orders/:id/receipts`
- Reporting: `/api/reports/*`, `/api/notifications`, `/api/audit-logs`

Centralize role checks, validate inputs and return explicit structured errors for permission denial, stale revisions, deadline closure and failed business rules.

## 8. Seeded end-to-end case

Demo buyer: **Cedar Grove Hotels**, with departments Operations, Engineering and Housekeeping. Suppliers: **Peak HVAC**, **Metro Electrical** and **Allied Facilities**. Seed a request for 20 air-conditioning replacement units, an approved RFQ with 3 supplier bids, a bid under evaluation, an award pending finance approval, an issued PO with 40% received, and another RFQ whose deadline has passed. Add a second unrelated buyer organization for tenant-isolation testing. Seed role-specific logins and local test credentials (development only).

Important: supplier quotes should have differing unit prices, lead times and non-price scores, including a lowest-priced but technically unqualified bid. This forces the comparison logic to show meaningful results.

## 9. Acceptance criteria and automated tests

| Test ID | Scenario                                       | Required outcome                                          |
| ------- | ---------------------------------------------- | --------------------------------------------------------- |
| B-01    | Requester creates and submits purchase request | Validated rows and immutable submission revision          |
| B-02    | Requester attempts to approve own request      | Denied by API                                             |
| B-03    | Finance approves purchase above threshold      | Ordered approval audit and status change                  |
| B-04    | Procurement publishes RFQ                      | Invited supplier portals show RFQ; requirements frozen    |
| B-05    | Uninvited supplier opens RFQ ID                | 403/404; no content leaks                                 |
| B-06    | Supplier A tries to view supplier B's bid      | 403/404, including direct API access                      |
| B-07    | Supplier saves draft then submits bid          | Revision and submitted timestamp persisted                |
| B-08    | Submission after deadline                      | Rejected regardless of client clock                       |
| B-09    | Evaluation weights do not total 100%           | Publishing/evaluation blocked with clear validation error |
| B-10    | Lowest-priced bid is disqualified              | Excluded from price normalization and award eligibility   |
| B-11    | Non-top-ranked bid is recommended              | Additional approval required with justification           |
| B-12    | Approver awards supplier                       | Correct bid snapshot and PO draft created exactly once    |
| B-13    | Unauthorized PO issue                          | Denied; event logged                                      |
| B-14    | Partial delivery receipt recorded              | Outstanding quantity and PO state updated                 |
| B-15    | Attempt to over-receive PO line                | Transaction rejected; persisted totals unchanged          |
| B-16    | Reload and restart server                      | All bids, scores, PO and receipts persist                 |
| B-17    | Duplicate POST for award/receipt               | No duplicate financial records                            |
| B-18    | User from buyer Org B queries buyer Org A      | No cross-tenant data exposure                             |

Add unit tests for weighted scoring, monetary math, approval thresholds, deadline comparisons and receipt totals. End-to-end scenarios must run using Playwright and the actual database.

## 10. Scope and build sequence

| Phase                        | Estimated effort | Output                                                |
| ---------------------------- | ---------------: | ----------------------------------------------------- |
| Foundation and permissions   |            5–7 h | Authentication, SQL schema, roles, demo seeds         |
| Requests, budgets, approvals |            5–7 h | Purchase requests with real validation and approvals  |
| RFQ and supplier bidding     |            7–9 h | Publish, invite, supplier portal, deadline-safe bids  |
| Bid scoring and award        |            5–8 h | Comparison matrix, scoring, decision audit            |
| PO, receiving and dashboards |            5–7 h | Committed spend, PO issue, partial receipt, reporting |
| Playwright and hardening     |            3–7 h | Tests, security verification, polish, docs            |

**Must ship as an integrated MVP:** one complete request → approval → RFQ → three supplier bids → evaluation → award approval → purchase order → partial/full receipt flow. If time becomes constrained, reduce visualization polish or advanced budget breakdowns, not integrity checks.

## 11. Definition of done

- All required roles have working login and appropriate restricted navigation.
- Supplier bidding confidentiality is enforced on the backend, not only visually.
- Scoring uses actual persisted bid data and transparent formulas.
- Approval rules and no-self-approval are enforced in SQL-backed workflows.
- Purchase orders and receipts are generated only after authorized state transitions.
- The MVP generates purchase orders, not payable invoices; all UI terminology reflects that distinction.
- No backend access to internet is required to demonstrate the entire process.
- Every listed Playwright acceptance scenario passes on a reset local dataset.
- Complete README, migrations, seed scripts and troubleshooting notes are delivered.

## 12. Post-MVP opportunities

Multi-supplier split awards, contract/blanket POs, multi-currency with approved FX sources, tax localization, external invitation emails, vendor self-registration, procurement ERP integrations, supplier performance weighting, negotiated rounds, e-signature, invoice matching and commercial billing.

---

**Implementation note:** Do not create static supplier cards or hardcoded bids as substitutes for workflows. Build backend authorization first, then implement request → RFQ → bid → comparison → award → PO → receiving. Prove the workflow with Playwright before adding decorative dashboards.
