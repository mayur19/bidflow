import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-07 award recommendations; decisions flow through /approvals (BF-041). */
export const awardsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-040', permission: 'evaluations:read' },
  { method: 'get', path: '/:id', ticket: 'BF-040', permission: 'evaluations:read' },
];

export const createAwardsRouter = (): Router => pendingRouter(awardsPendingRoutes, [requireAuth]);
