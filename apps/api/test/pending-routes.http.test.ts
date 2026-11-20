import type { Role } from '@bidflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDb, silentLogger, testEnv } from './helpers.js';

/** Authenticated as `role` through a fake session lookup; GET requests need no CSRF token. */
function getAs(role: Role, path: string) {
  const app = createApp({
    env: testEnv(),
    logger: silentLogger,
    db: fakeDb({ sessionRole: role }),
    version: 'test',
  });
  return request(app).get(`/api/v1${path}`).set('Cookie', 'sid=fake-session-token');
}

describe('pending API surface (PRD §7)', () => {
  it.each<[Role, string, string]>([
    ['REQUESTER', '/purchase-requests', 'BF-017'],
    ['APPROVER', '/approvals', 'BF-020'],
    ['PROCUREMENT_OFFICER', '/suppliers', 'BF-024'],
    ['PROCUREMENT_OFFICER', '/rfqs', 'BF-027'],
    ['PROCUREMENT_OFFICER', '/rfqs/00000000-0000-4000-8000-000000000009/comparison', 'BF-037'],
    ['SUPPLIER_USER', '/supplier/rfqs', 'BF-033'],
    ['RECEIVING_CLERK', '/purchase-orders', 'BF-044'],
    ['APPROVER', '/reports/dashboard', 'BF-048'],
    ['SUPPLIER_USER', '/notifications', 'BF-050'],
    ['BUYER_ADMIN', '/audit-logs', 'BF-051'],
    ['BUYER_ADMIN', '/departments/00000000-0000-4000-8000-000000000009/budgets', 'BF-014'],
  ])('%s GET %s -> 501 %s', async (role, path, ticket) => {
    const res = await getAs(role, path);
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', details: { ticket } },
    });
  });

  it.each<[Role, string]>([
    ['SUPPLIER_USER', '/rfqs'],
    ['SUPPLIER_USER', '/departments'],
    ['SUPPLIER_USER', '/purchase-orders'],
    ['PROCUREMENT_OFFICER', '/supplier/rfqs'],
    ['RECEIVING_CLERK', '/rfqs'],
    ['REQUESTER', '/audit-logs'],
  ])('%s GET %s -> 403 before reaching the placeholder', async (role, path) => {
    const res = await getAs(role, path);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
