-- 0002 buyer actor model and departments with budgets (FR-01, ADR-0007, ADR-0013).
-- `organizations` is the buyer organization table from PRD §6 (buyer_organizations).

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN (
    'BUYER_ADMIN',
    'REQUESTER',
    'PROCUREMENT_OFFICER',
    'APPROVER',
    'RECEIVING_CLERK',
    'SUPPLIER_USER'
  ));

-- Fixed organization currency; departments and RFQs inherit it (no FX in MVP).
ALTER TABLE organizations
  ADD COLUMN default_currency char(3) NOT NULL DEFAULT 'USD'
    CHECK (default_currency ~ '^[A-Z]{3}$');

-- Money is stored as integer minor units (bigint), never numeric/float.
-- The upper bound keeps values inside the JavaScript safe-integer range.
CREATE TABLE departments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code             text NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9-]{1,15}$'),
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  budget_period    text NOT NULL CHECK (budget_period IN ('MONTHLY', 'QUARTERLY')),
  budget_minor     bigint NOT NULL CHECK (budget_minor BETWEEN 0 AND 9007199254740991),
  currency         char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  is_active        boolean NOT NULL DEFAULT true,
  version          integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  -- Target for future composite (organization_id, department_id) foreign keys.
  UNIQUE (organization_id, id)
);

CREATE UNIQUE INDEX departments_org_name_uq ON departments (organization_id, lower(name));
CREATE INDEX departments_org_active_code_idx ON departments (organization_id, is_active, code);
