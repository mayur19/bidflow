import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-09 dashboard metrics, spend reports and CSV export. */
export const reportsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/dashboard', ticket: 'BF-048', permission: 'reports:read' },
  { method: 'get', path: '/spend', ticket: 'BF-049', permission: 'reports:read' },
  { method: 'get', path: '/supplier-performance', ticket: 'BF-049', permission: 'reports:read' },
  { method: 'get', path: '/rfq-cycle-time', ticket: 'BF-049', permission: 'reports:read' },
  { method: 'get', path: '/:report/export.csv', ticket: 'BF-049', permission: 'reports:read' },
];

export const createReportsRouter = (): Router => pendingRouter(reportsPendingRoutes, [requireAuth]);
