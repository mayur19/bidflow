# ADR-0011: Local file attachment storage

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

Requests carry specifications and bids carry supporting documents (FR-02, FR-05). The PRD requires
files on local disk with strict type and size limits and metadata in SQL, with no external storage.

## Decision Drivers

- No runtime internet or object store dependency.
- Prevent path traversal, content-type confusion and cross-tenant downloads.
- Allow a later move to object storage without schema changes.

## Considered Options

1. Local disk under `UPLOAD_DIR` with random storage keys and an `attachments` metadata table.
2. Store bytes in PostgreSQL `bytea`.
3. Object storage (S3-compatible).

## Decision Outcome

Chosen option: **local disk + metadata table** (BF-022). Files are written to
`UPLOAD_DIR/<organization_id>/<uuid>` (never the client filename), with an allow-list
(PDF, PNG, JPEG, XLSX, DOCX, CSV), `UPLOAD_MAX_BYTES` (default 10 MiB) and magic-byte sniffing.
Downloads go through an authorized API endpoint that checks the owning record's access rules
(including supplier isolation) and sets `Content-Disposition: attachment` and `nosniff`. The
`/uploads` static path is not served directly in production.

### Consequences

- Positive: works offline; storage interface allows a later object-store adapter.
- Negative: disk must be backed up alongside PostgreSQL; single-node storage until moved.

## Links

- [ADR-0015 supplier portal isolation](0015-supplier-portal-isolation-and-sealed-bids.md)
