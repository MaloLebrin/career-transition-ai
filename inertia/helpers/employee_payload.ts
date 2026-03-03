import type { Employee } from '../types'

/**
 * Payload for PUT /dashboard/employees/:id (fields accepted by updateEmployeeValidator).
 * Used by profile save, onboarding complete, and advisor notes.
 */
export function employeeUpdatePayload(employee: Partial<Employee>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (employee.name !== undefined) payload.name = employee.name
  if (employee.currentRole !== undefined) payload.currentRole = employee.currentRole
  if (employee.targetRole !== undefined) payload.targetRole = employee.targetRole
  if (employee.summary !== undefined) payload.summary = employee.summary
  if (employee.advisorNotes !== undefined) payload.advisorNotes = employee.advisorNotes
  if (employee.status !== undefined) payload.status = employee.status
  if (employee.onboarded !== undefined) payload.onboarded = employee.onboarded
  if (employee.nextAppointment !== undefined) payload.nextAppointment = employee.nextAppointment
  return payload
}
