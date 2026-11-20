import { describe, expect, it } from 'vitest';
import { BUYER_ROLES, hasPermission, PERMISSIONS, ROLE_LABELS, ROLES } from '../src/index.js';

describe('permission matrix (ADR-0007)', () => {
  it('labels every role', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual([...ROLES].sort());
    expect(BUYER_ROLES).not.toContain('SUPPLIER_USER');
    expect(BUYER_ROLES).toHaveLength(ROLES.length - 1);
  });

  it('lets only admins manage departments; suppliers and clerks cannot read budgets', () => {
    expect(hasPermission('BUYER_ADMIN', 'departments:manage')).toBe(true);
    expect(hasPermission('PROCUREMENT_OFFICER', 'departments:manage')).toBe(false);
    expect(hasPermission('REQUESTER', 'departments:read')).toBe(true);
    expect(hasPermission('SUPPLIER_USER', 'departments:read')).toBe(false);
    expect(hasPermission('RECEIVING_CLERK', 'departments:read')).toBe(false);
  });

  it('confines suppliers to the portal and notifications', () => {
    const supplierPermissions = Object.keys(PERMISSIONS).filter((p) =>
      hasPermission('SUPPLIER_USER', p as keyof typeof PERMISSIONS),
    );
    expect(supplierPermissions.sort()).toEqual(['notifications:read', 'supplier-portal:access']);
  });

  it('keeps receiving clerks away from commercial terms', () => {
    expect(hasPermission('RECEIVING_CLERK', 'receipts:record')).toBe(true);
    expect(hasPermission('RECEIVING_CLERK', 'rfqs:manage')).toBe(false);
    expect(hasPermission('RECEIVING_CLERK', 'awards:recommend')).toBe(false);
  });

  it('never grants buyer-side portal access', () => {
    expect(BUYER_ROLES.some((role) => hasPermission(role, 'supplier-portal:access'))).toBe(false);
  });
});
