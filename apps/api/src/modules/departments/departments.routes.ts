import { createDepartmentSchema, listDepartmentsQuerySchema, uuidSchema } from '@bidflow/shared';
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { sendOk } from '../../lib/http.js';
import { pendingRouter } from '../../lib/not-implemented.js';
import { parseOrThrow } from '../../lib/validate.js';
import { requirePermission } from '../../middleware/authorize.js';
import type { DepartmentService } from './department.service.js';

/** FR-01 departments with budgets: list / create / get are implemented (BF-009). */
export function createDepartmentsRouter(service: DepartmentService): Router {
  const router = Router();

  router.get(
    '/',
    requirePermission('departments:read'),
    asyncHandler(async (req, res) => {
      const query = parseOrThrow(listDepartmentsQuerySchema, req.query);
      const page = await service.list(req.auth!.user, query);
      sendOk(res, page.items, 200, page.meta);
    }),
  );

  router.post(
    '/',
    requirePermission('departments:manage'),
    asyncHandler(async (req, res) => {
      const input = parseOrThrow(createDepartmentSchema, req.body);
      sendOk(res, await service.create(req.auth!.user, input, req.requestId), 201);
    }),
  );

  router.get(
    '/:id',
    requirePermission('departments:read'),
    asyncHandler(async (req, res) => {
      const id = parseOrThrow(uuidSchema, req.params.id);
      sendOk(res, await service.get(req.auth!.user, id));
    }),
  );

  router.use(
    pendingRouter([
      { method: 'patch', path: '/:id', ticket: 'BF-013', permission: 'departments:manage' },
      {
        method: 'get',
        path: '/:id/cost-centers',
        ticket: 'BF-013',
        permission: 'departments:read',
      },
      {
        method: 'post',
        path: '/:id/cost-centers',
        ticket: 'BF-013',
        permission: 'departments:manage',
      },
      { method: 'get', path: '/:id/budgets', ticket: 'BF-014', permission: 'departments:read' },
      {
        method: 'put',
        path: '/:id/budgets/:period',
        ticket: 'BF-014',
        permission: 'departments:manage',
      },
    ]),
  );

  return router;
}
