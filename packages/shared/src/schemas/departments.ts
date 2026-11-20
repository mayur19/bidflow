import { z } from 'zod';
import { MAX_SAFE_MINOR } from '../domain/rounding.js';
import { paginationQuerySchema } from './common.js';

/** FR-01: departments carry a planning budget per period, in integer minor units. */
export const BUDGET_PERIODS = ['MONTHLY', 'QUARTERLY'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

export const departmentCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9-]{1,15}$/, 'Use 2–16 letters, digits or hyphens (e.g. ENG or OPS-2)');

export const createDepartmentSchema = z
  .object({
    code: departmentCodeSchema,
    name: z.string().trim().min(1, 'Name is required').max(120),
    budgetPeriod: z.enum(BUDGET_PERIODS),
    budgetMinor: z
      .number()
      .int('Budget must be a whole number of minor units')
      .min(0, 'Budget cannot be negative')
      .max(MAX_SAFE_MINOR, 'Budget is too large'),
  })
  .strict();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const listDepartmentsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
});

export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;

export const departmentSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  budgetPeriod: z.enum(BUDGET_PERIODS),
  budget: z.object({ amountMinor: z.number().int(), currency: z.string().length(3) }),
  isActive: z.boolean(),
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Department = z.infer<typeof departmentSchema>;
