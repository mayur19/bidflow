# ADR-0009: Configuration and secrets management

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The repository is public. Local development must work from a fresh clone with no manual secret
handling, while production must refuse unsafe configuration.

## Decision Drivers

- No real secrets in git, ever.
- Fail fast on missing or unsafe configuration.
- Same configuration mechanism locally and in production.

## Considered Options

1. Environment variables validated by a zod schema at startup; `.env` only for local use.
2. Config files per environment committed to the repository.
3. Runtime fetch from a secrets service in every environment.

## Decision Outcome

Chosen option: **validated environment variables** (`apps/api/src/config/env.ts`). `.env.example`
contains placeholders only; `run.sh` copies it to an untracked `.env` (mode 600) and generates a
random `SESSION_SECRET`. The process refuses to boot with a secret shorter than 32 characters or
with the placeholder secret in production. The seed refuses to run when `NODE_ENV=production`;
demo credentials are development-only and documented in the README. In production, variables come
from a secrets manager (see `docs/operations/deployment.md`, BF-059). CI runs gitleaks.

### Consequences

- Positive: a fresh clone runs with zero manual configuration.
- Negative: environment variables are visible to the process tree; acceptable for this threat model.

## Links

- [Runbook configuration table](../operations/runbook.md)
- [SECURITY.md](../../SECURITY.md)
