# ADR-0005: Session authentication with scrypt and CSRF protection

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

All authentication lives in the application (PRD §2). Buyer users and provisioned supplier users
sign in with email and password. There is no external identity provider in the MVP.

## Decision Drivers

- Revocable sessions (deactivate a supplier or user immediately).
- No secrets in browser storage; resist XSS token theft.
- Standard, dependency-free password hashing.

## Considered Options

1. Opaque server-side sessions in PostgreSQL, HttpOnly cookie, scrypt hashing, HMAC CSRF token.
2. Stateless JWT access/refresh tokens in local storage.
3. Third-party auth service.

## Decision Outcome

Chosen option: **opaque server-side sessions**:

- 256-bit random token in an `HttpOnly; SameSite=Lax` cookie (`Secure` in production); only its
  SHA-256 hash is stored in `sessions`.
- Passwords hashed with Node's `scrypt` (N=32768, r=8, p=1, 16-byte salt); minimum 12 characters.
- Login runs a hash comparison even for unknown emails and returns one generic 401.
- CSRF: Origin/Referer must match `APP_ORIGIN` for unsafe methods, and authenticated unsafe
  requests must send `X-CSRF-Token = HMAC(SESSION_SECRET, session token)`.
- Login is rate limited separately (`AUTH_RATE_LIMIT_MAX`).

### Consequences

- Positive: deactivation and logout take effect on the next request.
- Positive: no token in JavaScript-readable storage.
- Negative: one session lookup per request (indexed primary key; acceptable at SMB scale).
- Pending: password change revokes other sessions (BF-052); supplier user provisioning (BF-025).

## Links

- `apps/api/src/security/password.ts`, `apps/api/src/security/tokens.ts`, `apps/api/src/middleware/csrf.ts`
- [Threat model](../security/threat-model.md)
