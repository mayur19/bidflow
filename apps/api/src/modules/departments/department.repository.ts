import {
  parseMinorUnits,
  type BudgetPeriod,
  type CreateDepartmentInput,
  type Department,
} from '@bidflow/shared';
import type { Queryable } from '../../db/pool.js';

interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  budget_period: BudgetPeriod;
  budget_minor: string;
  currency: string;
  is_active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, code, name, budget_period, budget_minor, currency, is_active, version,
                 created_at, updated_at`;

function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    budgetPeriod: row.budget_period,
    budget: { amountMinor: parseMinorUnits(row.budget_minor), currency: row.currency },
    isActive: row.is_active,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Escape LIKE wildcards so user search text is matched literally. */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export interface ListDepartmentsFilter {
  readonly search?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface InsertDepartment extends CreateDepartmentInput {
  readonly organizationId: string;
  readonly currency: string;
  readonly createdBy: string;
}

/**
 * Data access for departments. Every statement is scoped by organization_id
 * taken from the session (ADR-0003); ids alone never select a row.
 */
export function createDepartmentRepository(db: Queryable) {
  return {
    async list(organizationId: string, filter: ListDepartmentsFilter) {
      const params: unknown[] = [organizationId, filter.limit, filter.offset];
      const searchClause = filter.search
        ? `AND (code ILIKE $${params.push(likePattern(filter.search))} OR name ILIKE $${params.length})`
        : '';
      const { rows } = await db.query<DepartmentRow & { total: string }>(
        `SELECT ${COLUMNS}, count(*) OVER () AS total
           FROM departments
          WHERE organization_id = $1 ${searchClause}
          ORDER BY code ASC
          LIMIT $2 OFFSET $3`,
        params,
      );
      return { items: rows.map(toDepartment), total: rows[0] ? Number(rows[0].total) : 0 };
    },

    async findById(organizationId: string, id: string): Promise<Department | null> {
      const { rows } = await db.query<DepartmentRow>(
        `SELECT ${COLUMNS} FROM departments WHERE organization_id = $1 AND id = $2`,
        [organizationId, id],
      );
      return rows[0] ? toDepartment(rows[0]) : null;
    },

    async insert(input: InsertDepartment): Promise<Department> {
      const { rows } = await db.query<DepartmentRow>(
        `INSERT INTO departments
           (organization_id, code, name, budget_period, budget_minor, currency, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${COLUMNS}`,
        [
          input.organizationId,
          input.code,
          input.name,
          input.budgetPeriod,
          input.budgetMinor,
          input.currency,
          input.createdBy,
        ],
      );
      return toDepartment(rows[0]!);
    },

    async organizationCurrency(organizationId: string): Promise<string | null> {
      const { rows } = await db.query<{ default_currency: string }>(
        'SELECT default_currency FROM organizations WHERE id = $1',
        [organizationId],
      );
      return rows[0]?.default_currency ?? null;
    },
  };
}

export type DepartmentRepository = ReturnType<typeof createDepartmentRepository>;
