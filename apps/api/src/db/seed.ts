import type { BudgetPeriod, Role } from '@bidflow/shared';
import type { Logger } from 'pino';
import type pg from 'pg';
import { hashPassword } from '../security/password.js';
import { withTransaction, type Db } from './pool.js';

/**
 * DEVELOPMENT-ONLY seed data. Credentials below are public, documented in
 * README, and must never exist in a production database. The seed refuses
 * to run when NODE_ENV=production. It is idempotent (safe to re-run).
 *
 * TODO(BF-053): extend with the full PRD §8 dataset (suppliers, the
 * 20-unit air-conditioning request, RFQs with three bids, award pending
 * finance approval, issued PO with 40% received, an expired RFQ).
 */
export const DEMO_PASSWORD = 'DemoPassword!2026';

const DEMO_ORGS = [
  { slug: 'cedar-grove-hotels', name: 'Cedar Grove Hotels', currency: 'USD' },
  { slug: 'harborview-clinics', name: 'Harborview Clinics', currency: 'EUR' },
] as const;

type OrgSlug = (typeof DEMO_ORGS)[number]['slug'];

interface DemoUser {
  readonly org: OrgSlug;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
}

export const DEMO_USERS: readonly DemoUser[] = [
  {
    org: 'cedar-grove-hotels',
    email: 'admin@cedargrove.example',
    displayName: 'Avery Collins',
    role: 'BUYER_ADMIN',
  },
  {
    org: 'cedar-grove-hotels',
    email: 'requester@cedargrove.example',
    displayName: 'Jordan Patel',
    role: 'REQUESTER',
  },
  {
    org: 'cedar-grove-hotels',
    email: 'procurement@cedargrove.example',
    displayName: 'Morgan Reyes',
    role: 'PROCUREMENT_OFFICER',
  },
  {
    org: 'cedar-grove-hotels',
    email: 'finance@cedargrove.example',
    displayName: 'Taylor Brooks',
    role: 'APPROVER',
  },
  {
    org: 'cedar-grove-hotels',
    email: 'receiving@cedargrove.example',
    displayName: 'Casey Nguyen',
    role: 'RECEIVING_CLERK',
  },
  // Supplier login provisioned by Cedar Grove for Peak HVAC (portal invitation model, ADR-0015).
  {
    org: 'cedar-grove-hotels',
    email: 'bids@peakhvac.example',
    displayName: 'Riley Shaw (Peak HVAC)',
    role: 'SUPPLIER_USER',
  },
  {
    org: 'harborview-clinics',
    email: 'admin@harborview.example',
    displayName: 'Sam Okafor',
    role: 'BUYER_ADMIN',
  },
];

interface DemoDepartment {
  readonly org: OrgSlug;
  readonly code: string;
  readonly name: string;
  readonly period: BudgetPeriod;
  readonly budgetMinor: number;
}

const DEMO_DEPARTMENTS: readonly DemoDepartment[] = [
  {
    org: 'cedar-grove-hotels',
    code: 'OPS',
    name: 'Operations',
    period: 'MONTHLY',
    budgetMinor: 2_500_000,
  },
  {
    org: 'cedar-grove-hotels',
    code: 'ENG',
    name: 'Engineering',
    period: 'QUARTERLY',
    budgetMinor: 18_000_000,
  },
  {
    org: 'cedar-grove-hotels',
    code: 'HSK',
    name: 'Housekeeping',
    period: 'MONTHLY',
    budgetMinor: 1_250_000,
  },
  {
    org: 'harborview-clinics',
    code: 'FAC',
    name: 'Facilities',
    period: 'QUARTERLY',
    budgetMinor: 4_000_000,
  },
  {
    org: 'harborview-clinics',
    code: 'CLIN',
    name: 'Clinical Supplies',
    period: 'MONTHLY',
    budgetMinor: 950_000,
  },
];

async function upsertOrganizations(tx: pg.PoolClient): Promise<ReadonlyMap<string, string>> {
  const entries = await Promise.all(
    DEMO_ORGS.map(async (org) => {
      const { rows } = await tx.query<{ id: string }>(
        `INSERT INTO organizations (slug, name, default_currency) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, default_currency = EXCLUDED.default_currency
         RETURNING id`,
        [org.slug, org.name, org.currency],
      );
      return [org.slug, rows[0]!.id] as const;
    }),
  );
  return new Map(entries);
}

async function upsertUsers(
  tx: pg.PoolClient,
  orgIds: ReadonlyMap<string, string>,
  passwordHash: string,
) {
  for (const user of DEMO_USERS) {
    await tx.query(
      `INSERT INTO users (organization_id, email, display_name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET display_name = EXCLUDED.display_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash`,
      [orgIds.get(user.org), user.email, user.displayName, user.role, passwordHash],
    );
  }
}

async function upsertDepartments(tx: pg.PoolClient, orgIds: ReadonlyMap<string, string>) {
  for (const dept of DEMO_DEPARTMENTS) {
    await tx.query(
      `INSERT INTO departments (organization_id, code, name, budget_period, budget_minor, currency)
       SELECT o.id, $2, $3, $4, $5, o.default_currency FROM organizations o WHERE o.id = $1
       ON CONFLICT (organization_id, code) DO NOTHING`,
      [orgIds.get(dept.org), dept.code, dept.name, dept.period, dept.budgetMinor],
    );
  }
}

export async function seed(db: Db, logger: Logger): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production');
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await withTransaction(db, async (tx) => {
    const orgIds = await upsertOrganizations(tx);
    await upsertUsers(tx, orgIds, passwordHash);
    await upsertDepartments(tx, orgIds);
  });
  logger.info(
    { users: DEMO_USERS.length, departments: DEMO_DEPARTMENTS.length },
    'development demo seed applied',
  );
}
