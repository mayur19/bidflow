import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/**
 * FR-06/FR-07 evaluation endpoints, mounted under /rfqs. The comparison
 * engine itself is implemented in @bidflow/shared (BF-008); these routes
 * wire persisted bids into it once bidding exists.
 */
export const evaluationsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/:id/comparison', ticket: 'BF-037', permission: 'evaluations:read' },
  { method: 'get', path: '/:id/evaluations', ticket: 'BF-038', permission: 'evaluations:read' },
  { method: 'post', path: '/:id/evaluations', ticket: 'BF-038', permission: 'evaluations:score' },
  {
    method: 'post',
    path: '/:id/bids/:bidId/qualification',
    ticket: 'BF-038',
    permission: 'evaluations:score',
  },
  {
    method: 'post',
    path: '/:id/recommend-award',
    ticket: 'BF-040',
    permission: 'awards:recommend',
  },
];

export const createEvaluationsRouter = (): Router =>
  pendingRouter(evaluationsPendingRoutes, [requireAuth]);
