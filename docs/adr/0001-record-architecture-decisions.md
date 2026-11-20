# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

BidFlow handles purchasing decisions that must be explainable months later: why a supplier won,
why a purchase order was allowed, why a bid was excluded. The same discipline applies to the
software. Engineers joining the project need to know why the system is shaped the way it is
without reverse-engineering intent from code.

## Decision Drivers

- Decisions must be discoverable next to the code they govern.
- Changes to a decision must be traceable (who superseded what, and why).
- The format must be lightweight enough that people actually write records.

## Considered Options

1. Markdown Architecture Decision Records (MADR) in `docs/adr/`.
2. A wiki outside the repository.
3. No formal records; rely on pull request descriptions.

## Decision Outcome

Chosen option: **MADR files in `docs/adr/`**, numbered sequentially (`NNNN-title.md`) and indexed
in [README.md](README.md). Code that depends on a decision references it (`ADR-0013`). An accepted
ADR is never edited in substance; a new ADR supersedes it and both are cross-linked.

### Consequences

- Positive: decisions are versioned and reviewed with the code; pull requests can cite them.
- Positive: new contributors get the "why" in one place.
- Negative: records can go stale if superseding ADRs are not written; reviewers must ask for them.

## Links

- [MADR](https://adr.github.io/madr/)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
