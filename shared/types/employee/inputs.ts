import type { EmployeeStatus } from '#shared/constants/employee'

export type CreateEmployeeInput = {
  organizationId: number
  advisorId?: number | null
  name: string
  email: string
  currentRole?: string
  targetRole?: string
  summary?: string
}

export type UpdateEmployeeInput = {
  advisorNotes?: string
  status?: EmployeeStatus
  targetRole?: string
  summary?: string
  name?: string
  currentRole?: string
  onboarded?: boolean
}
