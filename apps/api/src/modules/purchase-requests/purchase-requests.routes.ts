import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-02 purchase requests (B-01). Record-level rules: own requests, department membership. */
export const purchaseRequestsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-017', permission: 'purchase-requests:read' },
  { method: 'post', path: '/', ticket: 'BF-017', permission: 'purchase-requests:write' },
  { method: 'get', path: '/:id', ticket: 'BF-017', permission: 'purchase-requests:read' },
  { method: 'patch', path: '/:id', ticket: 'BF-018', permission: 'purchase-requests:write' },
  { method: 'post', path: '/:id/submit', ticket: 'BF-018', permission: 'purchase-requests:write' },
  { method: 'post', path: '/:id/revise', ticket: 'BF-018', permission: 'purchase-requests:write' },
  { method: 'post', path: '/:id/cancel', ticket: 'BF-018', permission: 'purchase-requests:write' },
  {
    method: 'get',
    path: '/:id/attachments',
    ticket: 'BF-022',
    permission: 'purchase-requests:read',
  },
  {
    method: 'post',
    path: '/:id/attachments',
    ticket: 'BF-022',
    permission: 'purchase-requests:write',
  },
];

export const createPurchaseRequestsRouter = (): Router =>
  pendingRouter(purchaseRequestsPendingRoutes, [requireAuth]);
