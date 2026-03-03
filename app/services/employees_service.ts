import { DateTime } from 'luxon'
import Employee from '#models/employee'
import { mapEmployee } from '#mappers/employee_mapper'
import type { EmployeeDto } from '#dtos/employee_dto'

type CreateEmployeeInput = {
  organizationId: number
  advisorId?: number | null
  name: string
  email: string
  currentRole?: string
  targetRole?: string
  summary?: string
}

type UpdateEmployeeInput = {
  advisorNotes?: string
  status?: Employee['status']
  targetRole?: string
  summary?: string
  name?: string
  currentRole?: string
  onboarded?: boolean
  nextAppointment?: string
}

export class EmployeesService {
  public async create(input: CreateEmployeeInput): Promise<EmployeeDto> {
    const employee = await Employee.create({
      organizationId: input.organizationId,
      advisorId: input.advisorId ?? null,
      userId: null,
      name: input.name,
      email: input.email,
      currentRole: input.currentRole ?? '',
      targetRole: input.targetRole ?? null,
      summary: input.summary ?? null,
      advisorNotes: null,
      // use default status defined at DB/migration level
      onboarded: false,
      nextAppointment: null,
    })

    await employee.load('skills', (q) => q.pivotColumns(['level']))
    await employee.load('experiences')
    await employee.load('educations')
    await employee.load('exerciseResults')
    await employee.load('supportPlanSteps')
    await employee.load('appointments')

    return mapEmployee(employee)
  }

  public applyUpdate(employee: Employee, payload: UpdateEmployeeInput): Employee {
    employee.merge({
      advisorNotes: payload.advisorNotes ?? employee.advisorNotes,
      status: payload.status ?? employee.status,
      targetRole: payload.targetRole ?? employee.targetRole,
      summary: payload.summary ?? employee.summary,
      name: payload.name ?? employee.name,
      currentRole: payload.currentRole ?? employee.currentRole,
      onboarded:
        typeof payload.onboarded === 'boolean' ? payload.onboarded : employee.onboarded,
      nextAppointment: payload.nextAppointment
        ? DateTime.fromISO(payload.nextAppointment)
        : employee.nextAppointment,
    })

    return employee
  }
}

