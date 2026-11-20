import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-03 supplier directory and supplier login provisioning. */
export const suppliersPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-024', permission: 'suppliers:read' },
  { method: 'post', path: '/', ticket: 'BF-024', permission: 'suppliers:manage' },
  { method: 'get', path: '/:id', ticket: 'BF-024', permission: 'suppliers:read' },
  { method: 'patch', path: '/:id', ticket: 'BF-024', permission: 'suppliers:manage' },
  { method: 'post', path: '/:id/status', ticket: 'BF-024', permission: 'suppliers:manage' },
  { method: 'get', path: '/:id/users', ticket: 'BF-025', permission: 'suppliers:manage' },
  { method: 'post', path: '/:id/users', ticket: 'BF-025', permission: 'suppliers:manage' },
];

export const createSuppliersRouter = (): Router =>
  pendingRouter(suppliersPendingRoutes, [requireAuth]);
