# User Stories

Stories are grouped by PRD §3 role. Each lists acceptance criteria and its FR and ticket
references. Status: ✅ implemented, ⏳ pending.

## Buyer Organization Admin

**US-01 Manage departments and budgets** ✅ (FR-01; BF-009, BF-010, BF-011)
As a buyer admin, I want to create departments with a monthly or quarterly planning budget so
that every purchase has a budget source.

- Department code is unique per organization (2–16 letters, digits or hyphens); duplicates are rejected.
- Budget is entered in major units and stored as integer minor units in the organization currency.
- Other roles cannot create departments; suppliers and receiving clerks cannot see budgets.
- Another buyer organization can never list or open these departments.
- Creation is recorded in the audit trail.

**US-02 Configure organization settings** ⏳ (FR-01; BF-012)
As a buyer admin, I want to set the default currency, timezone and spend-approval threshold so
that approvals and RFQs follow our policy.

- Only admins can change settings; threshold is stored in minor units.
- Currency cannot change once purchase requests exist.

**US-03 Maintain cost centers and budget periods** ⏳ (FR-01; BF-013, BF-014)
As a buyer admin, I want cost centers and per-period budgets with requested, approved and committed
amounts so that I can see budget pressure before it becomes spend.

- Figures are computed from persisted requests and POs and show their definitions.
- Missing data displays as "Not available".

**US-04 Administer users and memberships** ⏳ (§3, FR-01; BF-015)
As a buyer admin, I want to add users, assign roles and department memberships so that people
only act within their remit.

- The last Buyer Admin cannot be removed; deactivated users lose their sessions.

## Requester

**US-05 Raise a purchase request** ⏳ (FR-02, B-01; BF-016, BF-017, BF-021)
As a requester, I want to create a request with department, purpose, needed-by date and line items
so that procurement can source what I need.

- Quantities must be positive; a purchase description is required.
- A unique request code is generated per organization.
- I can only choose departments I belong to.

**US-06 Submit and revise** ⏳ (FR-02, B-01; BF-018)
As a requester, I want to submit my request and revise it if needed so that approvers always see
a stable version.

- Submission creates an immutable revision.
- Editing after submission creates a revised draft that must be resubmitted; past decisions remain.

**US-07 Attach specifications** ⏳ (FR-02; BF-022)
As a requester, I want to upload specifications so that suppliers quote the right item.

- Only allowed file types under the size limit are accepted.

**US-08 Cannot approve my own request** ⏳ (FR-02, B-02; BF-020)
As a requester, I must not be able to approve my own request, even through the API.

## Approver / Finance

**US-09 Decide approvals** ⏳ (FR-02, FR-07, B-03; BF-019, BF-020, BF-023)
As an approver, I want an inbox of pending approvals so that I can approve, reject or ask for
clarification with a reason.

- Requests above the threshold require my finance approval after the manager step.
- Decisions are ordered, audited and idempotent.

**US-10 Approve awards** ⏳ (FR-07, B-12; BF-041, BF-042)
As finance, I want to approve awards that exceed the threshold, exceed budget or deviate from the
top-ranked bid so that commitments stay within policy.

- I cannot approve an award I recommended.
- Approval creates exactly one PO draft with the awarded bid snapshot.

**US-11 See committed spend** ⏳ (FR-01, FR-09; BF-014, BF-048)
As finance, I want to see committed spend per department so that I can spot over-commitment early.

## Procurement Officer

**US-12 Manage suppliers** ⏳ (FR-03; BF-024, BF-025, BF-026)
As a procurement officer, I want a supplier directory with activation status and supplier logins
so that only vetted suppliers can respond.

- Deactivation blocks new responses but preserves past submissions.
- Supplier logins are provisioned in-app; no email is claimed to be sent.

**US-13 Create and publish an RFQ** ⏳ (FR-04, B-04, B-09; BF-027–BF-032)
As a procurement officer, I want to create an RFQ from an approved request, configure criteria,
weights, deadline and invitees, and publish it so that suppliers respond on the same terms.

- Weights must total 100 % with exactly one price criterion; otherwise publishing is blocked.
- Publishing freezes commercial lines; amendments create a new revision and notify invitees in-app.
- I can close early with a recorded reason.

**US-14 Compare bids objectively** ◐ (FR-06, B-10; BF-008 ✅, BF-037, BF-038, BF-039)
As a procurement officer, I want a comparison matrix with line totals, lead times, normalized price
points and weighted qualitative scores so that I can defend the decision.

- The lowest-priced bid and the lowest qualified bid are both labelled.
- Disqualified or non-compliant bids are shown with reasons but excluded from normalization and ranking.
- Ties are broken deterministically. (Engine implemented and unit-tested; persisted workflow pending.)

**US-15 Recommend an award** ◐ (FR-07, B-11; BF-008 ✅, BF-040)
As a procurement officer, I want to recommend one supplier for all lines with my reasoning so that
finance can approve it.

- Recommending a non-top-ranked bid requires a justification and triggers finance approval.
- Unqualified bids cannot be recommended.

**US-16 Issue a purchase order** ⏳ (FR-08, B-13; BF-043, BF-044)
As a procurement officer, I want to issue the PO generated from the approved award so that the
supplier receives traceable terms.

- Issuing is denied and audited when unauthorized or over budget without an approved exception.
- Issued PO lines and prices are immutable; a print-ready view is available.

## Supplier User

**US-17 See only my invitations** ⏳ (FR-03, B-05; BF-033, BF-036)
As a supplier user, I want to see only RFQs my company is invited to so that I can respond.

- Opening any other RFQ id returns not found with no content.
- I never see competitors, internal scores or budgets.

**US-18 Submit a bid before the deadline** ⏳ (FR-05, B-06, B-07, B-08; BF-034, BF-035, BF-036)
As a supplier user, I want to save a draft, revise it and submit before the deadline so that my
best offer is considered.

- Each save creates a revision; submission records the server timestamp.
- Submissions after the deadline are rejected regardless of my device clock.
- I can withdraw before close; I cannot access another supplier's bid.

**US-19 Read my award outcome** ⏳ (FR-03, FR-05; BF-035)
As a supplier user, I want to read the outcome of RFQs I bid on, without competitor details.

## Receiving Clerk

**US-20 Record deliveries** ⏳ (FR-08, B-14, B-15; BF-045, BF-046)
As a receiving clerk, I want to record received quantities per PO line so that outstanding
quantities and PO status stay accurate.

- Partial receipts update outstanding quantity and move the PO to partially received.
- Receiving more than ordered is rejected and nothing is persisted.
- I cannot change RFQ or commercial terms.

## All buyer roles

**US-21 Notifications** ⏳ (FR-09; BF-050) — In-app alerts for approvals requested, RFQ published,
bids submitted, RFQs closing, award decided and deliveries overdue.

**US-22 Reports and export** ⏳ (FR-09; BF-048, BF-049) — Dashboard and spend reports with CSV
export of data I am authorized to see.

**US-23 Audit trail** ⏳ (FR-10; BF-051) — Admins and finance can review an append-only history
of every state change with actor and snapshot hashes.
