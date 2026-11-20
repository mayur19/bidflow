import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import type { Db } from '../src/db/pool.js';
import { DEMO_PASSWORD } from '../src/db/seed.js';
import { freshDatabase, testDatabaseUrl } from './db-setup.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/**
 * Real-PostgreSQL integration tests. Enabled when TEST_DATABASE_URL points at
 * a disposable database (run.sh test sets this up). The schema is dropped!
 */
describe.skipIf(!testDatabaseUrl)('integration: auth against PostgreSQL', () => {
  let db: Db;

  beforeAll(async () => {
    db = await freshDatabase();
  });

  afterAll(async () => {
    await db?.end();
  });

  it('is idempotent when migrations run twice', async () => {
    await expect(runMigrations(db, silentLogger)).resolves.toEqual([]);
  });

  it('logs in, enforces CSRF, reads session, logs out', async () => {
    const agent = request.agent(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    );

    const login = await agent
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'admin@cedargrove.example', password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']?.[0]).toMatch(/HttpOnly; SameSite=Lax/);
    const csrf: string = login.body.data.csrfToken;

    const me = await agent.get('/api/v1/me');
    expect(me.body.data.email).toBe('admin@cedargrove.example');

    const noCsrf = await agent.post('/api/v1/auth/logout').set('Origin', TEST_ORIGIN);
    expect(noCsrf.status).toBe(403);

    const logout = await agent
      .post('/api/v1/auth/logout')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', csrf);
    expect(logout.status).toBe(200);
    expect((await agent.get('/api/v1/me')).status).toBe(401);

    const audit = await db.query(
      "SELECT count(*)::int AS n FROM audit_events WHERE action = 'auth.login'",
    );
    expect(audit.rows[0].n).toBeGreaterThan(0);
  });

  it('rejects wrong passwords generically', async () => {
    const res = await request(
      createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
    )
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'admin@cedargrove.example', password: 'wrong-password-123' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Authentication required');
  });
});
