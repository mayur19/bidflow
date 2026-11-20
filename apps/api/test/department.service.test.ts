import type { SessionUser } from '@bidflow/shared';
import { describe, expect, it, vi } from 'vitest';
import type { Db } from '../src/db/pool.js';
import type { DepartmentRepository } from '../src/modules/departments/department.repository.js';
import { createDepartmentService } from '../src/modules/departments/department.service.js';

const actor = (role: SessionUser['role']): SessionUser => ({
  id: '00000000-0000-4000-8000-000000000001',
  organizationId: '00000000-0000-4000-8000-0000000000aa',
  organizationName: 'Cedar Grove Hotels',
  email: 'x@cedargrove.example',
  displayName: 'X',
  role,
});

function setup(overrides: Partial<DepartmentRepository> = {}, txError?: unknown) {
  const repository: DepartmentRepository = {
    list: vi.fn(async () => ({ items: [], total: 0 })),
    findById: vi.fn(async () => null),
    insert: vi.fn(async () => {
      throw txError ?? new Error('not configured');
    }),
    organizationCurrency: vi.fn(async () => 'USD'),
    ...overrides,
  };
  const client = { query: vi.fn(async () => ({ rows: [] })), release: vi.fn() };
  const db = { connect: vi.fn(async () => client) } as unknown as Db;
  const service = createDepartmentService({ db, repositoryFor: () => repository });
  return { service, repository, client };
}

const input = {
  code: 'OPS',
  name: 'Operations',
  budgetPeriod: 'MONTHLY' as const,
  budgetMinor: 100,
};

describe('department service', () => {
  it('scopes list queries to the session organization and computes offsets', async () => {
    const { service, repository } = setup();
    const page = await service.list(actor('REQUESTER'), { page: 3, limit: 10, q: '' });
    expect(repository.list).toHaveBeenCalledWith(actor('REQUESTER').organizationId, {
      search: undefined,
      limit: 10,
      offset: 20,
    });
    expect(page.meta).toEqual({ total: 0, page: 3, limit: 10 });
  });

  it('re-checks permissions even if a route forgot to (defence in depth)', async () => {
    const { service } = setup();
    await expect(service.list(actor('SUPPLIER_USER'), { page: 1, limit: 1 })).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    );
    await expect(service.get(actor('RECEIVING_CLERK'), 'id')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(service.create(actor('PROCUREMENT_OFFICER'), input, 'req')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns 404 for records outside the tenant', async () => {
    const { service } = setup();
    await expect(service.get(actor('BUYER_ADMIN'), 'id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('maps unique violations to CONFLICT and rolls back', async () => {
    const { service, client } = setup({}, Object.assign(new Error('dup'), { code: '23505' }));
    await expect(service.create(actor('BUYER_ADMIN'), input, 'req')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('rethrows unexpected errors and fails when the organization is missing', async () => {
    const boom = new Error('db down');
    await expect(setup({}, boom).service.create(actor('BUYER_ADMIN'), input, 'req')).rejects.toBe(
      boom,
    );
    const missingOrg = setup({ organizationCurrency: vi.fn(async () => null) });
    await expect(
      missingOrg.service.create(actor('BUYER_ADMIN'), input, 'req'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
