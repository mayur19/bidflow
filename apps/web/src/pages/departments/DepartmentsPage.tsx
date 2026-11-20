import { hasPermission, type CreateDepartmentInput } from '@bidflow/shared';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentTable } from './DepartmentTable';
import { createDepartment, fetchDepartments, type DepartmentList } from './departments.api';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly list: DepartmentList };

/**
 * FR-01 departments with planning budgets (PRD §4.3). Budgets are planning
 * controls, not ledger balances; requested/approved/committed rollups are
 * tracked as BF-014.
 */
export function DepartmentsPage() {
  const { state } = useAuth();
  const [search, setSearch] = useState('');
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async (query: string) => {
    try {
      setLoad({ status: 'ready', list: await fetchDepartments(1, query) });
    } catch {
      setLoad({ status: 'error', message: 'Departments could not be loaded.' });
    }
  }, []);

  useEffect(() => {
    void refresh('');
  }, [refresh]);

  if (state.status !== 'authenticated') return null;
  const canManage = hasPermission(state.user.role, 'departments:manage');
  // TODO(BF-012): read the organization currency from /organization once it exists.
  const currency = load.status === 'ready' ? (load.list.items[0]?.budget.currency ?? 'USD') : 'USD';

  const onCreate = async (input: CreateDepartmentInput) => {
    const created = await createDepartment(input);
    setNotice(`Department ${created.code} created.`);
    await refresh(search);
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1>Departments &amp; budgets</h1>
        <p className="muted">Planning budgets per department. Amounts are in {currency}.</p>
      </header>
      <form
        className="toolbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void refresh(search);
        }}
      >
        <label className="field field--inline">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Code or name"
          />
        </label>
        <button type="submit" className="btn btn--ghost">
          Search
        </button>
      </form>
      {notice ? (
        <p className="alert alert--success" role="status">
          {notice}
        </p>
      ) : null}
      <div className={canManage ? 'split' : undefined}>
        <div>
          {load.status === 'loading' ? <p role="status">Loading departments…</p> : null}
          {load.status === 'error' ? (
            <p className="alert alert--error" role="alert">
              {load.message}
            </p>
          ) : null}
          {load.status === 'ready' ? (
            <>
              <DepartmentTable items={load.list.items} />
              {load.list.meta ? (
                <p className="muted">{load.list.meta.total} department(s)</p>
              ) : null}
            </>
          ) : null}
        </div>
        {canManage ? <DepartmentForm currency={currency} onCreate={onCreate} /> : null}
      </div>
    </section>
  );
}
