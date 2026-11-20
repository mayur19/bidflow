import {
  hasPermission,
  type CreateDepartmentInput,
  type Department,
  type ListDepartmentsQuery,
  type PageMeta,
  type SessionUser,
} from '@bidflow/shared';
import { withTransaction, type Db, type Queryable } from '../../db/pool.js';
import { errors } from '../../lib/errors.js';
import { recordAudit } from '../audit/audit.service.js';
import { createDepartmentRepository, type DepartmentRepository } from './department.repository.js';

const UNIQUE_VIOLATION = '23505';

export interface DepartmentServiceDeps {
  readonly db: Db;
  readonly repositoryFor?: (db: Queryable) => DepartmentRepository;
}

export interface DepartmentPage {
  readonly items: readonly Department[];
  readonly meta: PageMeta;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/** Defence in depth: services re-check the permission the route already gated. */
function assertCan(
  actor: SessionUser,
  permission: 'departments:read' | 'departments:manage',
): void {
  if (!hasPermission(actor.role, permission)) throw errors.forbidden();
}

export function createDepartmentService(deps: DepartmentServiceDeps) {
  const repositoryFor = deps.repositoryFor ?? createDepartmentRepository;
  const repository = repositoryFor(deps.db);

  return {
    async list(actor: SessionUser, query: ListDepartmentsQuery): Promise<DepartmentPage> {
      assertCan(actor, 'departments:read');
      const { items, total } = await repository.list(actor.organizationId, {
        search: query.q || undefined,
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
      });
      return { items, meta: { total, page: query.page, limit: query.limit } };
    },

    async get(actor: SessionUser, id: string): Promise<Department> {
      assertCan(actor, 'departments:read');
      const department = await repository.findById(actor.organizationId, id);
      if (!department) throw errors.notFound('Department');
      return department;
    },

    /** Creates the department and its audit event in one transaction (ADR-0008). */
    async create(
      actor: SessionUser,
      input: CreateDepartmentInput,
      requestId: string,
    ): Promise<Department> {
      assertCan(actor, 'departments:manage');
      try {
        return await withTransaction(deps.db, async (tx) => {
          const repo = repositoryFor(tx);
          const currency = await repo.organizationCurrency(actor.organizationId);
          if (!currency) throw errors.notFound('Organization');
          const department = await repo.insert({
            ...input,
            organizationId: actor.organizationId,
            currency,
            createdBy: actor.id,
          });
          await recordAudit(tx, {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: 'department.created',
            entityType: 'department',
            entityId: department.id,
            metadata: {
              code: department.code,
              budgetPeriod: department.budgetPeriod,
              budget: department.budget,
            },
            requestId,
          });
          return department;
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw errors.conflict('A department with this code or name already exists');
        }
        throw error;
      }
    },
  };
}

export type DepartmentService = ReturnType<typeof createDepartmentService>;
