import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-09 in-app notification inbox (no external email). */
export const notificationsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-050', permission: 'notifications:read' },
  { method: 'post', path: '/:id/read', ticket: 'BF-050', permission: 'notifications:read' },
];

export const createNotificationsRouter = (): Router =>
  pendingRouter(notificationsPendingRoutes, [requireAuth]);
