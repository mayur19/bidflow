import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DepartmentTable } from '../src/pages/departments/DepartmentTable';

describe('DepartmentTable', () => {
  it('formats integer minor units for display', () => {
    render(
      <DepartmentTable
        items={[
          {
            id: '00000000-0000-4000-8000-000000000001',
            code: 'ENG',
            name: 'Engineering',
            budgetPeriod: 'QUARTERLY',
            budget: { amountMinor: 18_000_000, currency: 'USD' },
            isActive: true,
            version: 1,
            createdAt: '2026-11-20T00:00:00.000Z',
            updatedAt: '2026-11-20T00:00:00.000Z',
          },
        ]}
      />,
    );
    expect(screen.getByText('USD 180,000.00')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    render(<DepartmentTable items={[]} />);
    expect(screen.getByText(/No departments match/)).toBeInTheDocument();
  });
});
