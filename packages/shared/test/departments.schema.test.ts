import { describe, expect, it } from 'vitest';
import { createDepartmentSchema, listDepartmentsQuerySchema } from '../src/index.js';

const valid = {
  code: ' eng ',
  name: ' Engineering ',
  budgetPeriod: 'QUARTERLY',
  budgetMinor: 18_000_000,
};

describe('createDepartmentSchema', () => {
  it('normalises code and name', () => {
    expect(createDepartmentSchema.parse(valid)).toEqual({
      code: 'ENG',
      name: 'Engineering',
      budgetPeriod: 'QUARTERLY',
      budgetMinor: 18_000_000,
    });
  });

  it.each([
    ['fractional budget', { budgetMinor: 10.5 }],
    ['negative budget', { budgetMinor: -1 }],
    ['unsafe budget', { budgetMinor: Number.MAX_SAFE_INTEGER + 1 }],
    ['string budget', { budgetMinor: '100' }],
    ['bad code', { code: 'a b' }],
    ['one-char code', { code: 'A' }],
    ['empty name', { name: '  ' }],
    ['unknown period', { budgetPeriod: 'YEARLY' }],
    ['client-supplied currency', { currency: 'EUR' }],
    ['client-supplied organization', { organizationId: '00000000-0000-4000-8000-000000000000' }],
  ])('rejects %s', (_label, patch) => {
    expect(createDepartmentSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe('listDepartmentsQuerySchema', () => {
  it('defaults pagination and trims search', () => {
    expect(listDepartmentsQuerySchema.parse({ q: ' ops ' })).toEqual({
      page: 1,
      limit: 25,
      q: 'ops',
    });
  });
});
