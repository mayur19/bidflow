import {
  BUDGET_PERIODS,
  createDepartmentSchema,
  isDomainError,
  parseMajorUnits,
  type BudgetPeriod,
  type CreateDepartmentInput,
} from '@bidflow/shared';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';

interface DepartmentFormProps {
  readonly currency: string;
  readonly onCreate: (input: CreateDepartmentInput) => Promise<void>;
}

const EMPTY = { code: '', name: '', budgetPeriod: 'MONTHLY' as BudgetPeriod, budget: '' };

/** Converts the major-unit text input to integer minor units before validation. */
function toInput(values: typeof EMPTY, currency: string): CreateDepartmentInput {
  const { budget, ...rest } = values;
  return createDepartmentSchema.parse({ ...rest, budgetMinor: parseMajorUnits(budget, currency) });
}

function describeError(error: unknown): string {
  if (isDomainError(error)) return error.message;
  if (error instanceof ApiError) {
    return error.status === 409 ? 'That code or name is already in use.' : error.message;
  }
  if (error instanceof Error && 'issues' in error) return 'Check the code and name fields.';
  return 'Could not create the department. Try again.';
}

export function DepartmentForm({ currency, onCreate }: DepartmentFormProps) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const update = (patch: Partial<typeof EMPTY>) => setValues((prev) => ({ ...prev, ...patch }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate(toInput(values, currency));
      setValues(EMPTY);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit} noValidate aria-label="Add department">
      <h2>Add department</h2>
      <label className="field">
        <span>Code</span>
        <input
          value={values.code}
          onChange={(e) => update({ code: e.target.value })}
          required
          maxLength={16}
        />
      </label>
      <label className="field">
        <span>Name</span>
        <input
          value={values.name}
          onChange={(e) => update({ name: e.target.value })}
          required
          maxLength={120}
        />
      </label>
      <label className="field">
        <span>Budget period</span>
        <select
          value={values.budgetPeriod}
          onChange={(e) => update({ budgetPeriod: e.target.value as BudgetPeriod })}
        >
          {BUDGET_PERIODS.map((period) => (
            <option key={period} value={period}>
              {period === 'MONTHLY' ? 'Monthly' : 'Quarterly'}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Budget ({currency})</span>
        <input
          inputMode="decimal"
          placeholder="12500.00"
          value={values.budget}
          onChange={(e) => update({ budget: e.target.value })}
          required
        />
      </label>
      {error ? (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Saving…' : 'Add department'}
      </button>
    </form>
  );
}
