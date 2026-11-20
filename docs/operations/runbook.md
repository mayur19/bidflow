# Runbook

Operational guide for running BidFlow locally and diagnosing problems. Production operation is planned in [deployment.md](deployment.md) (BF-059).

## 1. Local setup

Prerequisites: Node.js ≥ 22, npm, a running local PostgreSQL server (17 recommended) reachable as the current OS user, and `psql` on `PATH`.

```bash
git clone <repo-url> bidflow && cd bidflow
./run.sh            # install deps, create .env, create DB, migrate, seed, start API + web
```

Then open <http://localhost:5172>. The API listens on <http://127.0.0.1:4102>; the Vite dev server proxies `/api` and `/uploads` to it.

What `./run.sh` does on a fresh clone:

1. Checks Node, npm and `psql` versions.
2. Copies `.env.example` to `.env` (mode 600) and replaces the `SESSION_SECRET` placeholder with 32 random bytes.
3. Runs `npm ci` when `package-lock.json` is newer than the install stamp.
4. Creates the `bidflow_dev` database if missing.
5. Applies migrations (`apps/api/migrations/*.sql`).
6. Seeds development data only if the `users` table is empty.
7. Starts API and web together (`npm run dev`).

## 2. `run.sh` command reference

| Command                       | Purpose                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `./run.sh` / `./run.sh start` | Full setup, then launch API + web                                                                                                 |
| `./run.sh setup`              | Everything `start` does, without launching                                                                                        |
| `./run.sh migrate`            | Apply pending migrations                                                                                                          |
| `./run.sh seed`               | Load development demo data (idempotent)                                                                                           |
| `./run.sh reset [--yes]`      | Drop and recreate the `public` schema, migrate and seed. Asks for confirmation unless `--yes`. Refuses when `NODE_ENV=production` |
| `./run.sh test`               | Unit + integration tests against `<db>_test` (created if missing)                                                                 |
| `./run.sh e2e`                | Setup, install Playwright Chromium if possible, run Playwright                                                                    |
| `./run.sh check`              | Lint, format check, typecheck and tests (mirrors CI)                                                                              |
| `./run.sh build`              | Production build of API (`tsup`) and web (`vite build`)                                                                           |
| `./run.sh help`               | List commands                                                                                                                     |

## 3. Demo logins (development only)

Created by `./run.sh seed`. Password for every account: `DemoPassword!2026`. These accounts are public and the seed refuses to run with `NODE_ENV=production`.

| Email                          | Role                      | Organization                                 |
| ------------------------------ | ------------------------- | -------------------------------------------- |
| admin@cedargrove.example       | BUYER_ADMIN               | Cedar Grove Hotels                           |
| requester@cedargrove.example   | REQUESTER                 | Cedar Grove Hotels                           |
| procurement@cedargrove.example | PROCUREMENT_OFFICER       | Cedar Grove Hotels                           |
| finance@cedargrove.example     | APPROVER                  | Cedar Grove Hotels                           |
| receiving@cedargrove.example   | RECEIVING_CLERK           | Cedar Grove Hotels                           |
| bids@peakhvac.example          | SUPPLIER_USER (Peak HVAC) | Cedar Grove Hotels                           |
| admin@harborview.example       | BUYER_ADMIN               | Harborview Clinics (tenant-isolation checks) |

## 4. Configuration

All variables are read from `.env` (loaded by `run.sh` and by `node --env-file-if-exists`) and validated at startup by `apps/api/src/config/env.ts`. The process refuses to boot on invalid configuration and prints every failing key.

| Variable               | Default                                            | Used by           | Description                                                                                                                       |
| ---------------------- | -------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`                                      | API, seed, run.sh | `development`, `test` or `production`. Production blocks seed/reset and the placeholder secret, and sets the `Secure` cookie flag |
| `LOG_LEVEL`            | `info`                                             | API               | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`                                                                      |
| `API_HOST`             | `127.0.0.1`                                        | API, Vite proxy   | Bind address of the API                                                                                                           |
| `API_PORT`             | `4102`                                             | API, Vite proxy   | API port                                                                                                                          |
| `WEB_PORT`             | `5172`                                             | Vite, Playwright  | Web dev server port (strict; fails if taken)                                                                                      |
| `APP_ORIGIN`           | `http://localhost:5172` (required)                 | API CSRF          | Browser origin; unsafe requests from any other origin are rejected                                                                |
| `DATABASE_URL`         | `postgres://localhost:5432/bidflow_dev` (required) | API, run.sh       | PostgreSQL connection string. Database name must match `[A-Za-z0-9_]+`                                                            |
| `DATABASE_POOL_MAX`    | `10`                                               | API               | Pool size (1–100)                                                                                                                 |
| `SESSION_SECRET`       | placeholder, replaced by run.sh                    | API               | HMAC key for CSRF tokens; ≥ 32 characters; placeholder rejected in production                                                     |
| `SESSION_TTL_MINUTES`  | `480`                                              | API               | Session lifetime (5 minutes to 7 days)                                                                                            |
| `SESSION_COOKIE_NAME`  | `sid`                                              | API               | Cookie name (`[A-Za-z0-9_-]+`)                                                                                                    |
| `UPLOAD_DIR`           | `./uploads`                                        | API               | Attachment directory (used from BF-022)                                                                                           |
| `UPLOAD_MAX_BYTES`     | `10485760`                                         | API               | Maximum upload size in bytes (used from BF-022)                                                                                   |
| `RATE_LIMIT_WINDOW_MS` | `60000`                                            | API               | Rate-limit window                                                                                                                 |
| `RATE_LIMIT_MAX`       | `300`                                              | API               | Requests per window per client on `/api`                                                                                          |
| `AUTH_RATE_LIMIT_MAX`  | `10`                                               | API               | Login attempts per window per client                                                                                              |
| `TEST_DATABASE_URL`    | `<DATABASE_URL>_test` (`bidflow_dev_test`)         | tests, run.sh     | Disposable database for integration tests; its schema is dropped                                                                  |
| `MIGRATIONS_DIR`       | `apps/api/migrations`                              | migration runner  | Override migrations location                                                                                                      |
| `CI`                   | unset                                              | Playwright        | Disables server reuse, enables retries and `forbidOnly`                                                                           |

## 5. Health checks

| Endpoint                | Meaning                                   | Healthy response                                                              |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /api/health/live`  | Process is up; never touches dependencies | `200 {"success":true,"data":{"status":"ok","version":"0.1.0"}}`               |
| `GET /api/health/ready` | Database reachable (`SELECT 1`)           | `200 ... "status":"ready"`; `503 SERVICE_UNAVAILABLE` when PostgreSQL is down |

```bash
curl -s localhost:4102/api/health/ready
```

## 6. Logs

- The API writes structured JSON via pino to stdout (one object per line). Pipe through `npx pino-pretty` for local reading.
- Every response carries `X-Request-Id` (inbound value is accepted if it matches `[A-Za-z0-9-]{8,64}`), and error envelopes include `error.requestId`. Search logs by that id.
- Redacted fields: `cookie`, `authorization`, `x-csrf-token` request headers, `set-cookie` response header, any `password`/`passwordHash` property.
- 5xx application errors and unhandled errors are logged with stack; `NOT_IMPLEMENTED` (501) is not logged as an error.
- Security-relevant business events (login, department created) are in the `audit_events` table, not only in logs:

```sql
SELECT occurred_at, action, entity_type, entity_id, actor_user_id
  FROM audit_events ORDER BY occurred_at DESC LIMIT 20;
```

## 7. Common failures

| Symptom                                                                             | Cause                                                                                   | Fix                                                                                                     |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Cannot reach PostgreSQL via postgres://localhost:5432/postgres`                    | Server not running or wrong host/user                                                   | `brew services start postgresql@17` (macOS) or `sudo service postgresql start`; check `DATABASE_URL`    |
| `Port 5172 is in use` or API `EADDRINUSE :4102`                                     | Previous dev server still running                                                       | `lsof -ti tcp:4102 -ti tcp:5172 \| xargs kill`                                                          |
| `Migration 0002_... was modified after being applied`                               | An applied migration file was edited                                                    | Revert the edit and add a new `NNNN_*.sql` migration. In development only, `./run.sh reset --yes`       |
| `Invalid environment configuration: SESSION_SECRET: must be at least 32 characters` | Hand-edited `.env`                                                                      | Restore the placeholder line from `.env.example` and rerun `./run.sh` (it generates a secret)           |
| `403 CSRF_FAILED` on POST                                                           | Missing `X-CSRF-Token`, stale token after re-login, or origin not equal to `APP_ORIGIN` | Use the token from the login/session response; call through `http://localhost:5172`; check `APP_ORIGIN` |
| `401 UNAUTHENTICATED` after a while                                                 | Session expired (`SESSION_TTL_MINUTES`)                                                 | Sign in again                                                                                           |
| `429 RATE_LIMITED` on login                                                         | More than `AUTH_RATE_LIMIT_MAX` attempts per window                                     | Wait a minute or raise the limit locally                                                                |
| `users_role_check` violation                                                        | Old role names (e.g. from an older database)                                            | `./run.sh reset --yes` in development                                                                   |
| Playwright: `Executable doesn't exist`                                              | Chromium not installed                                                                  | `npx playwright install chromium`                                                                       |
| `501 NOT_IMPLEMENTED (tracked as BF-0xx)`                                           | Endpoint is registered but pending                                                      | Expected; see [backlog](../planning/backlog.md)                                                         |
| Integration tests skipped                                                           | `TEST_DATABASE_URL` not set                                                             | Run via `./run.sh test`                                                                                 |

## 8. Backup and restore

Local example; production uses managed PITR (see [deployment.md](deployment.md)).

```bash
# Backup (custom format, compressed)
pg_dump --format=custom --no-owner --file=bidflow-$(date +%Y%m%d%H%M).dump "$DATABASE_URL"

# Restore into a fresh database
createdb bidflow_restore
pg_restore --no-owner --dbname=postgres://localhost:5432/bidflow_restore bidflow-202611201200.dump

# Verify
psql postgres://localhost:5432/bidflow_restore -c "SELECT name, applied_at FROM schema_migrations ORDER BY name"
```

Attachments live in `UPLOAD_DIR`; back them up together with the database dump (`tar czf uploads.tgz apps/api/uploads`) so metadata and files stay consistent.

## 9. Resetting demo data

```bash
./run.sh reset --yes   # drop schema, migrate, seed
./run.sh seed          # re-apply seed only (idempotent; restores demo passwords and roles)
```

Reset refuses to run when `NODE_ENV=production`. The integration test database (`bidflow_dev_test`) is rebuilt automatically by each test run.
