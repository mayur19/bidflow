import type { CreateDepartmentInput, Department, PageMeta } from '@bidflow/shared';
import { api, apiEnvelope } from '../../api/client';

export interface DepartmentList {
  readonly items: readonly Department[];
  readonly meta: PageMeta | null;
}

/** Departments list needs the pagination meta, so it reads the raw envelope. */
export async function fetchDepartments(page: number, search: string): Promise<DepartmentList> {
  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (search.trim()) params.set('q', search.trim());
  const result = await apiEnvelope<readonly Department[]>(`/departments?${params.toString()}`);
  return { items: result.data, meta: result.meta ?? null };
}

export function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  return api.post<Department>('/departments', input);
}
