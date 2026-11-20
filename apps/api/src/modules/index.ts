import type { Router } from 'express';
import type { Db } from '../db/pool.js';
import { createAccountRouter } from './account/account.routes.js';
import { createApprovalsRouter } from './approvals/approvals.routes.js';
import { createAuditLogsRouter } from './audit/audit-logs.routes.js';
import { createAwardsRouter } from './awards/awards.routes.js';
import { createDepartmentService } from './departments/department.service.js';
import { createDepartmentsRouter } from './departments/departments.routes.js';
import { createEvaluationsRouter } from './evaluations/evaluations.routes.js';
import { createNotificationsRouter } from './notifications/notifications.routes.js';
import { createOrganizationRouter } from './organization/organization.routes.js';
import { createPurchaseOrdersRouter } from './purchase-orders/purchase-orders.routes.js';
import { createPurchaseRequestsRouter } from './purchase-requests/purchase-requests.routes.js';
import { createReportsRouter } from './reports/reports.routes.js';
import { createRfqsRouter } from './rfqs/rfqs.routes.js';
import { createSupplierPortalRouter } from './supplier-portal/supplier-portal.routes.js';
import { createSuppliersRouter } from './suppliers/suppliers.routes.js';
import { createUsersRouter } from './users/users.routes.js';

export interface ModuleDeps {
  readonly db: Db;
}

export interface MountedModule {
  readonly path: string;
  readonly router: Router;
}

/**
 * Product modules mounted under /api/v1. Each module owns its routes,
 * service, repository and schemas (ADR-0002). Endpoints not yet built are
 * registered with `pendingRouter` so the API surface matches the contract
 * (docs/api/openapi.yaml) and returns 401/403 or 501 + ticket id.
 */
export function productModules({ db }: ModuleDeps): readonly MountedModule[] {
  return [
    { path: '/departments', router: createDepartmentsRouter(createDepartmentService({ db })) },
    { path: '/organization', router: createOrganizationRouter() },
    { path: '/users', router: createUsersRouter() },
    { path: '/purchase-requests', router: createPurchaseRequestsRouter() },
    { path: '/approvals', router: createApprovalsRouter() },
    { path: '/suppliers', router: createSuppliersRouter() },
    { path: '/rfqs', router: createRfqsRouter() },
    { path: '/rfqs', router: createEvaluationsRouter() },
    { path: '/awards', router: createAwardsRouter() },
    { path: '/supplier', router: createSupplierPortalRouter() },
    { path: '/purchase-orders', router: createPurchaseOrdersRouter() },
    { path: '/reports', router: createReportsRouter() },
    { path: '/notifications', router: createNotificationsRouter() },
    { path: '/audit-logs', router: createAuditLogsRouter() },
    { path: '/account', router: createAccountRouter() },
  ];
}
