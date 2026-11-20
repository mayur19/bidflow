import type { Permission } from '@bidflow/shared';
import { Router, type RequestHandler } from 'express';
import { requirePermission } from '../middleware/authorize.js';
import { errors } from './errors.js';

/**
 * Placeholder handler for endpoints defined in the API contract but not yet
 * built. Returns 501 with the backlog ticket id so the gap is explicit.
 */
export function notImplemented(ticket: string): RequestHandler {
  return (_req, _res, next) => next(errors.notImplemented(ticket));
}

export interface PendingRoute {
  readonly method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  readonly path: string;
  readonly ticket: string;
  /** Permission the finished endpoint will require; enforced already (401/403 before 501). */
  readonly permission?: Permission;
}

/** Build a router whose every route responds 501 with its tracking ticket. */
export function pendingRouter(
  routes: readonly PendingRoute[],
  guards: readonly RequestHandler[] = [],
): Router {
  const router = Router();
  for (const route of routes) {
    const routeGuards = route.permission ? [requirePermission(route.permission)] : [];
    router[route.method](route.path, ...guards, ...routeGuards, notImplemented(route.ticket));
  }
  return router;
}
