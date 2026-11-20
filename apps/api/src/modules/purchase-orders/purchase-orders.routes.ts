import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-08 purchase orders and receipts (B-13, B-14, B-15, B-17). */
export const purchaseOrdersPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-044', permission: 'purchase-orders:read' },
  { method: 'get', path: '/:id', ticket: 'BF-044', permission: 'purchase-orders:read' },
  { method: 'post', path: '/:id/issue', ticket: 'BF-043', permission: 'purchase-orders:issue' },
  { method: 'post', path: '/:id/cancel', ticket: 'BF-043', permission: 'purchase-orders:issue' },
  { method: 'get', path: '/:id/receipts', ticket: 'BF-045', permission: 'purchase-orders:read' },
  { method: 'post', path: '/:id/receipts', ticket: 'BF-045', permission: 'receipts:record' },
];

export const createPurchaseOrdersRouter = (): Router =>
  pendingRouter(purchaseOrdersPendingRoutes, [requireAuth]);
