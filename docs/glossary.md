# Glossary

| Term                             | Definition                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buyer organization               | The tenant: a company using BidFlow to purchase. Stored in `organizations`; every tenant-owned row carries `organization_id`.                       |
| Supplier organization            | A vendor in a buyer organization's directory. Can be invited to RFQs; independent of buyer membership.                                              |
| Supplier user                    | A login provisioned by a buyer for a supplier organization. Sees only invited RFQs and its own bids.                                                |
| Purchase request (PR)            | An internal request to buy goods or services, with department, purpose, needed-by date, lines and an estimated budget.                              |
| Request code                     | Organization-scoped unique identifier of a purchase request (e.g. `PR-2026-0042`).                                                                  |
| Revision                         | An immutable version of a request, RFQ or bid. Editing after submission or publication creates a new revision.                                      |
| Approval step                    | One required decision (manager or finance) on a request, budget exception or award, decided in order.                                               |
| Spend-approval threshold         | Organization amount above which finance approval is required.                                                                                       |
| Self-approval                    | A user deciding an approval step on a subject they authored. Always denied.                                                                         |
| RFQ                              | Request for quotation: a structured sourcing event with lines, criteria, deadline and invited suppliers.                                            |
| Publication / freeze             | Making an RFQ visible to invitees; commercial line definitions can no longer change except through an amendment revision.                           |
| Invitation                       | Record that a supplier organization may see and bid on an RFQ. Simulated in-app; no email is sent.                                                  |
| Deadline                         | RFQ closing time stored in UTC and enforced with the server clock.                                                                                  |
| Bid                              | A supplier's response to an RFQ: per-line unit price, quantity confirmation, lead time, compliance and notes. One current bid per supplier and RFQ. |
| Sealed bid                       | A bid whose contents are hidden from buyers until the RFQ closes and from other suppliers always.                                                   |
| Withdrawn bid                    | A bid retracted by the supplier before close. Shown for audit; cannot win.                                                                          |
| Technically compliant            | Supplier/evaluator confirmation that a quoted line meets the specification. Any non-compliant line makes the bid unqualified.                       |
| Disqualification                 | An evaluator decision, with reason, that excludes a bid from normalization and award until cleared.                                                 |
| Qualified bid                    | A bid with no ineligibility reason (not withdrawn, disqualified, non-compliant, cross-currency, incomplete or zero-priced).                         |
| Lowest-priced bid                | Cheapest complete same-currency bid, even if unqualified; shown for transparency.                                                                   |
| Lowest qualified bid             | Cheapest qualified bid; the reference for price normalization.                                                                                      |
| Evaluation criterion             | A weighted scoring dimension: exactly one price criterion plus one or more qualitative criteria.                                                    |
| Weight (bps)                     | Criterion weight in basis points; all weights total 10 000 bps (100 %).                                                                             |
| Price points                     | `(lowest qualified total ÷ this total) × price weight`.                                                                                             |
| Qualitative score                | Evaluator score 0–100 for a non-price criterion, multiplied by its weight.                                                                          |
| Provisional comparison           | A comparison where some qualified bid lacks a qualitative score; recommendation is blocked.                                                         |
| Award recommendation             | Procurement's choice of one bid for all lines, with justification and a snapshot of bids, criteria and scores.                                      |
| Award snapshot                   | Immutable JSON copy of the chosen bid revision, criteria and scores, hashed into the audit trail.                                                   |
| Purchase order (PO)              | Commercial order issued to the awarded supplier. Not an invoice. Immutable once issued.                                                             |
| Receipt                          | Record of goods or services received against PO lines; cumulative receipts cannot exceed ordered quantity.                                          |
| Outstanding quantity             | Ordered quantity minus cumulative received quantity on a PO line.                                                                                   |
| Budget                           | A department's planning/approval control per period (monthly or quarterly). Not an accounting ledger.                                               |
| Requested / Approved / Committed | Sums of submitted requests, approved-but-unordered requests, and issued POs against a budget.                                                       |
| Minor units                      | Integer count of the smallest currency unit (cents for USD). All money is stored and computed this way.                                             |
| Basis point (bps)                | 1/100 of a percent; 10 000 bps = 100 %.                                                                                                             |
| Milli-unit                       | Quantity scale of 1/1000 unit used for fractional quantities (2.5 → 2500).                                                                          |
| ROUND HALF UP                    | The one rounding rule: half away from zero, applied once per derived amount.                                                                        |
| Pending route                    | An API endpoint registered with its permission and ticket that returns 501 until implemented.                                                       |
