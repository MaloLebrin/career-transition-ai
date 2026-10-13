import type { EmployeeStatus } from '#shared/constants/employee'
import type { ListParams } from '#shared/types/pagination'

/** Paramètres de la liste des candidats d'un conseiller (`?page=&search=&status=`). */
export interface EmployeeListParams extends ListParams {
  /** Statut filtré ; `null` = tous. */
  status: EmployeeStatus | null
}
