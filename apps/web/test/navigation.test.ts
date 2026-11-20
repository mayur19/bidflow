import { ROLES } from '@bidflow/shared';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, navItemsFor } from '../src/routes/navigation';

describe('navigation registry', () => {
  it('gives every pending screen a BF ticket', () => {
    for (const item of NAV_ITEMS.filter((i) => i.ticket)) {
      expect(item.ticket).toMatch(/^BF-\d{3}$/);
    }
  });

  it('confines suppliers to the portal, notifications and account', () => {
    expect(navItemsFor('SUPPLIER_USER').map((i) => i.path)).toEqual([
      '/',
      '/portal/rfqs',
      '/notifications',
      '/account',
    ]);
  });

  it('shows departments to buyer roles that can read budgets only', () => {
    const visible = ROLES.filter((role) =>
      navItemsFor(role).some((i) => i.path === '/settings/departments'),
    );
    expect(visible).toEqual(['BUYER_ADMIN', 'REQUESTER', 'PROCUREMENT_OFFICER', 'APPROVER']);
  });

  it('has unique paths', () => {
    expect(new Set(NAV_ITEMS.map((i) => i.path)).size).toBe(NAV_ITEMS.length);
  });
});
