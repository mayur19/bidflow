import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** PRD §3 user and department membership administration. */
export const usersPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-015', permission: 'users:manage' },
  { method: 'post', path: '/', ticket: 'BF-015', permission: 'users:manage' },
  { method: 'patch', path: '/:id', ticket: 'BF-015', permission: 'users:manage' },
  { method: 'put', path: '/:id/departments', ticket: 'BF-015', permission: 'users:manage' },
];

export const createUsersRouter = (): Router => pendingRouter(usersPendingRoutes, [requireAuth]);
