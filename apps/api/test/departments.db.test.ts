import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '../src/db/pool.js';
import { freshDatabase, signIn, testDatabaseUrl, type SignedInAgent } from './db-setup.js';
import { TEST_ORIGIN } from './helpers.js';

/** FR-01 vertical slice against real PostgreSQL: tenancy (B-18), RBAC, audit, pagination. */
describe.skipIf(!testDatabaseUrl)('integration: departments with budgets', () => {
  let db: Db;
  let admin: SignedInAgent;

  beforeAll(async () => {
    db = await freshDatabase();
    admin = await signIn(db, 'admin@cedargrove.example');
  });

  afterAll(async () => {
    await db?.end();
  });

  const create = (who: SignedInAgent, body: Record<string, unknown>) =>
    who.agent
      .post('/api/v1/departments')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', who.csrf)
      .send(body);

  it('lists only the caller organization departments, ordered by code', async () => {
    const res = await admin.agent.get('/api/v1/departments');
    expect(res.status).toBe(200);
    expect(res.body.data.map((d: { code: string }) => d.code)).toEqual(['ENG', 'HSK', 'OPS']);
    expect(res.body.meta).toEqual({ total: 3, page: 1, limit: 25 });
    expect(res.body.data[0].budget).toEqual({ amountMinor: 18_000_000, currency: 'USD' });
  });

  it('paginates and searches literally', async () => {
    const page = await admin.agent.get('/api/v1/departments?limit=2&page=2');
    expect(page.body.data.map((d: { code: string }) => d.code)).toEqual(['OPS']);
    expect(page.body.meta).toEqual({ total: 3, page: 2, limit: 2 });
    const search = await admin.agent.get('/api/v1/departments?q=house');
    expect(search.body.data.map((d: { code: string }) => d.code)).toEqual(['HSK']);
    const wildcard = await admin.agent.get('/api/v1/departments?q=%25');
    expect(wildcard.body.meta.total).toBe(0);
  });

  it('creates a department in the organization currency and audits it atomically', async () => {
    const res = await create(admin, {
      code: 'fnb',
      name: 'Food & Beverage',
      budgetPeriod: 'MONTHLY',
      budgetMinor: 1_575_050,
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      code: 'FNB',
      name: 'Food & Beverage',
      budget: { amountMinor: 1_575_050, currency: 'USD' },
      isActive: true,
      version: 1,
    });
    const audit = await db.query(
      `SELECT action, metadata FROM audit_events WHERE entity_type = 'department' AND entity_id = $1`,
      [res.body.data.id],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0].action).toBe('department.created');

    const fetched = await admin.agent.get(`/api/v1/departments/${res.body.data.id}`);
    expect(fetched.body.data).toEqual(res.body.data);
  });

  it('rejects duplicates with 409 and invalid money with 422, leaving no audit row', async () => {
    const before = await db.query(
      `SELECT count(*)::int AS n FROM audit_events WHERE action = 'department.created'`,
    );
    const duplicate = await create(admin, {
      code: 'OPS',
      name: 'Ops Two',
      budgetPeriod: 'MONTHLY',
      budgetMinor: 1,
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
    const fractional = await create(admin, {
      code: 'X1',
      name: 'X',
      budgetPeriod: 'MONTHLY',
      budgetMinor: 10.5,
    });
    expect(fractional.status).toBe(422);
    const after = await db.query(
      `SELECT count(*)::int AS n FROM audit_events WHERE action = 'department.created'`,
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('isolates tenants: Harborview cannot list or read Cedar Grove departments (B-18)', async () => {
    const other = await signIn(db, 'admin@harborview.example');
    const list = await other.agent.get('/api/v1/departments');
    expect(list.body.data.map((d: { code: string }) => d.code)).toEqual(['CLIN', 'FAC']);
    expect(list.body.data[0].budget.currency).toBe('EUR');

    const cedar = await admin.agent.get('/api/v1/departments?q=ENG');
    const cedarId: string = cedar.body.data[0].id;
    const read = await other.agent.get(`/api/v1/departments/${cedarId}`);
    expect(read.status).toBe(404);
    expect(read.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(read.body)).not.toContain('Engineering');
  });

  it('enforces roles: requester reads but cannot create; supplier and clerk get 403', async () => {
    const requester = await signIn(db, 'requester@cedargrove.example');
    expect((await requester.agent.get('/api/v1/departments')).status).toBe(200);
    const denied = await create(requester, {
      code: 'NOPE',
      name: 'Nope',
      budgetPeriod: 'MONTHLY',
      budgetMinor: 1,
    });
    expect(denied.status).toBe(403);

    for (const email of ['bids@peakhvac.example', 'receiving@cedargrove.example']) {
      const user = await signIn(db, email);
      const res = await user.agent.get('/api/v1/departments');
      expect(res.status).toBe(403);
      expect(res.body.data).toBeNull();
    }
  });

  it('rejects malformed ids and unauthenticated access', async () => {
    expect((await admin.agent.get('/api/v1/departments/not-a-uuid')).status).toBe(422);
    const anonymous = await signIn(db, 'admin@cedargrove.example');
    await anonymous.agent
      .post('/api/v1/auth/logout')
      .set('Origin', TEST_ORIGIN)
      .set('X-CSRF-Token', anonymous.csrf);
    expect((await anonymous.agent.get('/api/v1/departments')).status).toBe(401);
  });

  it('enforces the role CHECK constraint at the database', async () => {
    await expect(
      db.query(`UPDATE users SET role = 'ORG_ADMIN' WHERE email = 'admin@cedargrove.example'`),
    ).rejects.toThrow(/users_role_check/);
  });
});
