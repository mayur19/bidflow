import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** PRD §4.18 account settings for every signed-in user. */
export const accountPendingRoutes: readonly PendingRoute[] = [
  { method: 'patch', path: '/profile', ticket: 'BF-052' },
  { method: 'post', path: '/password', ticket: 'BF-052' },
];

export const createAccountRouter = (): Router => pendingRouter(accountPendingRoutes, [requireAuth]);
