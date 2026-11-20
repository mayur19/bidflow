import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-04 RFQ events: creation, criteria, publish/freeze, invitations, deadline. */
export const rfqsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-027', permission: 'rfqs:read' },
  { method: 'post', path: '/', ticket: 'BF-027', permission: 'rfqs:manage' },
  { method: 'get', path: '/:id', ticket: 'BF-027', permission: 'rfqs:read' },
  { method: 'patch', path: '/:id', ticket: 'BF-027', permission: 'rfqs:manage' },
  { method: 'put', path: '/:id/criteria', ticket: 'BF-028', permission: 'rfqs:manage' },
  { method: 'post', path: '/:id/publish', ticket: 'BF-029', permission: 'rfqs:manage' },
  { method: 'post', path: '/:id/amendments', ticket: 'BF-029', permission: 'rfqs:manage' },
  { method: 'get', path: '/:id/invitations', ticket: 'BF-030', permission: 'rfqs:read' },
  { method: 'post', path: '/:id/invitations', ticket: 'BF-030', permission: 'rfqs:manage' },
  { method: 'post', path: '/:id/close', ticket: 'BF-031', permission: 'rfqs:manage' },
  {
    method: 'post',
    path: '/:id/advance-deadline',
    ticket: 'BF-031',
    permission: 'demo:advance-clock',
  },
];

export const createRfqsRouter = (): Router => pendingRouter(rfqsPendingRoutes, [requireAuth]);
