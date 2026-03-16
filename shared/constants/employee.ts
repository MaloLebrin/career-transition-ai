export const EMPLOYEES_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
  ARCHIVED: 'archived',
  ONBOARDING: 'onboarding',
} as const

export type EmployeeStatus = (typeof EMPLOYEES_STATUS)[keyof typeof EMPLOYEES_STATUS]

export const employeeStatusValues = Object.values(EMPLOYEES_STATUS)
