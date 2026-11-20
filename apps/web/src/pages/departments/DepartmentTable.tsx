import { formatMoney, type Department } from '@bidflow/shared';

const PERIOD_LABELS: Readonly<Record<Department['budgetPeriod'], string>> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
};

export function DepartmentTable({ items }: { readonly items: readonly Department[] }) {
  if (items.length === 0) {
    return <p className="empty">No departments match. Admins can add one with the form.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Departments and planning budgets</caption>
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Name</th>
            <th scope="col">Budget period</th>
            <th scope="col" className="num">
              Budget
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((dept) => (
            <tr key={dept.id}>
              <td>
                <code>{dept.code}</code>
              </td>
              <td>{dept.name}</td>
              <td>{PERIOD_LABELS[dept.budgetPeriod]}</td>
              <td className="num">{formatMoney(dept.budget)}</td>
              <td>{dept.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
