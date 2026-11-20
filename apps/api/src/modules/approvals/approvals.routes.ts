import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-02/FR-07 approval steps for requests and awards (B-02, B-03). No self-approval. */
export const approvalsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-020', permission: 'approvals:decide' },
  { method: 'post', path: '/:id/decision', ticket: 'BF-020', permission: 'approvals:decide' },
];

export const createApprovalsRouter = (): Router =>
  pendingRouter(approvalsPendingRoutes, [requireAuth]);
