/**
 * BidFlow actor model (PRD §3) and the permission matrix (ADR-0007).
 * Authorization is always enforced by the API; the web only uses this to
 * hide navigation a user could not use anyway.
 */
export const ROLES = [
  'BUYER_ADMIN',
  'REQUESTER',
  'PROCUREMENT_OFFICER',
  'APPROVER',
  'RECEIVING_CLERK',
  'SUPPLIER_USER',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  BUYER_ADMIN: 'Buyer Organization Admin',
  REQUESTER: 'Requester',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  APPROVER: 'Approver / Finance',
  RECEIVING_CLERK: 'Receiving Clerk',
  SUPPLIER_USER: 'Supplier User',
};

/** Roles that act on behalf of the buying organization (everyone except suppliers). */
export const BUYER_ROLES: readonly Role[] = ROLES.filter((role) => role !== 'SUPPLIER_USER');

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

const ADMIN = 'BUYER_ADMIN';
const REQ = 'REQUESTER';
const PO = 'PROCUREMENT_OFFICER';
const FIN = 'APPROVER';
const RCV = 'RECEIVING_CLERK';
const SUP = 'SUPPLIER_USER';

/**
 * Coarse permission matrix. Record-level rules (own request, invited RFQ,
 * no self-approval, sealed bids before close) are enforced in services.
 */
export const PERMISSIONS = {
  'organization:manage': [ADMIN],
  'users:manage': [ADMIN],
  'departments:read': [ADMIN, REQ, PO, FIN],
  'departments:manage': [ADMIN],
  'purchase-requests:read': [ADMIN, REQ, PO, FIN],
  'purchase-requests:write': [ADMIN, REQ],
  'approvals:decide': [ADMIN, FIN],
  'suppliers:read': [ADMIN, PO, FIN],
  'suppliers:manage': [ADMIN, PO],
  'rfqs:read': [ADMIN, PO, FIN],
  'rfqs:manage': [ADMIN, PO],
  'evaluations:read': [ADMIN, PO, FIN],
  'evaluations:score': [ADMIN, PO],
  'awards:recommend': [ADMIN, PO],
  'purchase-orders:read': [ADMIN, PO, FIN, RCV],
  'purchase-orders:issue': [ADMIN, PO],
  'receipts:record': [ADMIN, RCV],
  'reports:read': [ADMIN, PO, FIN],
  'audit:read': [ADMIN, FIN],
  'supplier-portal:access': [SUP],
  'notifications:read': [ADMIN, REQ, PO, FIN, RCV, SUP],
  'demo:advance-clock': [ADMIN],
} as const satisfies Readonly<Record<string, readonly Role[]>>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
