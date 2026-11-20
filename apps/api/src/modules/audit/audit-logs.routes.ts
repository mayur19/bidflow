import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/** FR-10 read access to the append-only audit trail. */
export const auditLogsPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/', ticket: 'BF-051', permission: 'audit:read' },
];

export const createAuditLogsRouter = (): Router =>
  pendingRouter(auditLogsPendingRoutes, [requireAuth]);
