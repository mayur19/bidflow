import type { Router } from 'express';
import { pendingRouter, type PendingRoute } from '../../lib/not-implemented.js';
import { requireAuth } from '../../middleware/authorize.js';

/**
 * FR-03/FR-05 supplier portal (ADR-0015). Only SUPPLIER_USER may enter this
 * namespace, and only for RFQs its supplier organization is invited to.
 */
export const supplierPortalPendingRoutes: readonly PendingRoute[] = [
  { method: 'get', path: '/rfqs', ticket: 'BF-033', permission: 'supplier-portal:access' },
  { method: 'get', path: '/rfqs/:id', ticket: 'BF-033', permission: 'supplier-portal:access' },
  { method: 'get', path: '/rfqs/:id/bid', ticket: 'BF-034', permission: 'supplier-portal:access' },
  { method: 'put', path: '/rfqs/:id/bid', ticket: 'BF-034', permission: 'supplier-portal:access' },
  {
    method: 'post',
    path: '/bids/:id/submit',
    ticket: 'BF-035',
    permission: 'supplier-portal:access',
  },
  {
    method: 'post',
    path: '/bids/:id/withdraw',
    ticket: 'BF-035',
    permission: 'supplier-portal:access',
  },
  {
    method: 'get',
    path: '/rfqs/:id/outcome',
    ticket: 'BF-035',
    permission: 'supplier-portal:access',
  },
];

export const createSupplierPortalRouter = (): Router =>
  pendingRouter(supplierPortalPendingRoutes, [requireAuth]);
