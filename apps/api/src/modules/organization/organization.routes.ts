import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-01 organization settings: currency, timezone, approval threshold. */
export const organizationPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-012', permission: 'departments:read' },
  { method: 'patch', path: '/', ticket: 'BF-012', permission: 'organization:manage' },
];

export const createOrganizationRouter = (): Router =>
  pendingRouter(organizationPendingRoutes, [requireAuth]);
