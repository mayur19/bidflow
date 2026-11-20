import type { Role } from '@bidflow/shared';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  /** PRD §4 screen number(s) this entry delivers. */
  readonly screen: string;
  /** Backlog ticket that delivers this screen; omitted once implemented. */
  readonly ticket?: string;
  /** Roles that see the entry; omitted means every signed-in user. */
  readonly roles?: readonly Role[];
}

const ADMIN: Role = 'BUYER_ADMIN';
const REQ: Role = 'REQUESTER';
const PO: Role = 'PROCUREMENT_OFFICER';
const FIN: Role = 'APPROVER';
const RCV: Role = 'RECEIVING_CLERK';
const SUP: Role = 'SUPPLIER_USER';
const BUYERS: readonly Role[] = [ADMIN, REQ, PO, FIN, RCV];

/**
 * Primary navigation, from PRD §4. Screens with a ticket render a
 * placeholder. Visibility mirrors the API permission matrix (ADR-0007);
 * the API remains the enforcement point. Detail screens (§4.6, §4.10,
 * §4.12, print-ready PO) are reached from their lists.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Dashboard', screen: '1–2' },
  {
    path: '/approvals',
    label: 'Approvals',
    screen: '2, 6, 14',
    ticket: 'BF-023',
    roles: [ADMIN, FIN],
  },
  {
    path: '/purchase-requests',
    label: 'Purchase requests',
    screen: '4, 6',
    ticket: 'BF-021',
    roles: [ADMIN, REQ, PO, FIN],
  },
  {
    path: '/purchase-requests/new',
    label: 'New request',
    screen: '5',
    ticket: 'BF-021',
    roles: [ADMIN, REQ],
  },
  {
    path: '/suppliers',
    label: 'Suppliers',
    screen: '7',
    ticket: 'BF-026',
    roles: [ADMIN, PO, FIN],
  },
  { path: '/rfqs', label: 'RFQs', screen: '8, 10', ticket: 'BF-032', roles: [ADMIN, PO, FIN] },
  { path: '/rfqs/new', label: 'New RFQ', screen: '9', ticket: 'BF-032', roles: [ADMIN, PO] },
  {
    path: '/evaluations',
    label: 'Bid comparison',
    screen: '13',
    ticket: 'BF-039',
    roles: [ADMIN, PO, FIN],
  },
  { path: '/awards', label: 'Awards', screen: '14', ticket: 'BF-042', roles: [ADMIN, PO, FIN] },
  {
    path: '/purchase-orders',
    label: 'Purchase orders',
    screen: '15',
    ticket: 'BF-044',
    roles: [ADMIN, PO, FIN, RCV],
  },
  { path: '/receipts', label: 'Receipts', screen: '16', ticket: 'BF-046', roles: [ADMIN, RCV] },
  { path: '/reports', label: 'Reports', screen: '17', ticket: 'BF-049', roles: [ADMIN, PO, FIN] },
  {
    path: '/portal/rfqs',
    label: 'My invitations',
    screen: '11–12',
    ticket: 'BF-036',
    roles: [SUP],
  },
  {
    path: '/settings/departments',
    label: 'Departments & budgets',
    screen: '3',
    roles: [ADMIN, REQ, PO, FIN],
  },
  {
    path: '/settings/organization',
    label: 'Organization',
    screen: '3',
    ticket: 'BF-012',
    roles: [ADMIN],
  },
  { path: '/settings/users', label: 'Users', screen: '3', ticket: 'BF-015', roles: [ADMIN] },
  { path: '/audit-log', label: 'Audit log', screen: '18', ticket: 'BF-051', roles: [ADMIN, FIN] },
  {
    path: '/notifications',
    label: 'Notifications',
    screen: '18',
    ticket: 'BF-050',
    roles: [...BUYERS, SUP],
  },
  { path: '/account', label: 'Account', screen: '18', ticket: 'BF-052' },
];

export function navItemsFor(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
