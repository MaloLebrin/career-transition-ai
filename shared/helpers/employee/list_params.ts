import { employeeStatusValues, type EmployeeStatus } from '#shared/constants/employee'
import { parseListParams } from '#shared/helpers/pagination'
import type { EmployeeListParams } from '#shared/types/employee/list'

/** `?page=&search=&status=` de la liste des candidats ; statut inconnu ignoré. */
export function parseEmployeeListParams(qs: Record<string, unknown>): EmployeeListParams {
  const status = employeeStatusValues.includes(qs.status as EmployeeStatus)
    ? (qs.status as EmployeeStatus)
    : null
  return { ...parseListParams(qs), status }
}
