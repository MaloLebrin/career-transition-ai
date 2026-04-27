export const EMPLOYEES_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
  ARCHIVED: 'archived',
  ONBOARDING: 'onboarding',
} as const

export type EmployeeStatus = (typeof EMPLOYEES_STATUS)[keyof typeof EMPLOYEES_STATUS]

export const employeeStatusValues = Object.values(EMPLOYEES_STATUS)

export const EMPLOYEE_STATUS_TRANSLATIONS: Record<EmployeeStatus, string> = {
  [EMPLOYEES_STATUS.ACTIVE]: 'Actif',
  [EMPLOYEES_STATUS.ONBOARDING]: 'Onboarding',
  [EMPLOYEES_STATUS.ON_HOLD]: 'En pause',
  [EMPLOYEES_STATUS.COMPLETED]: 'Terminé',
  [EMPLOYEES_STATUS.ARCHIVED]: 'Archivé',
}
