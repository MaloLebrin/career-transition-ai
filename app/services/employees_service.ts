import { DateTime } from 'luxon'
import Employee from '#models/employee'
import User from '#models/user'
import OnboardingToken from '#models/onboarding_token'
import hash from '@adonisjs/core/services/hash'
import { mapEmployee } from '#mappers/employee_mapper'
import type { EmployeeDto } from '#dtos/employee_dto'
import { sendOnboardingEmail } from '#services/onboarding_notify_service'
import { USERS_ROLES } from '#models/user'

type CreateEmployeeInput = {
  organizationId: number
  advisorId?: number | null
  name: string
  email: string
  currentRole?: string
  targetRole?: string
  summary?: string
}

type CreateEmployeeOptions = {
  /** When set, a User account is created and an onboarding link is sent (e.g. by email). */
  baseUrl?: string
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

function randomPassword(): string {
  return Math.random().toString(36).slice(-16) + Date.now().toString(36)
}

export class EmployeesService {
  public async create(
    input: CreateEmployeeInput,
    options?: CreateEmployeeOptions
  ): Promise<EmployeeDto> {
    let userId: number | null = null

    if (options?.baseUrl) {
      const existingUser = await User.query()
        .where('organizationId', input.organizationId)
        .where('email', input.email)
        .first()

      if (existingUser) {
        // Vérifier si un employé déjà onboardé est lié à cet utilisateur dans l'organisation.
        const onboardedEmployee = await Employee.query()
          .where('organizationId', input.organizationId)
          .where('email', input.email)
          .andWhere('onboarded', true)
          .first()

        if (onboardedEmployee) {
          throw new Error(
            'Un utilisateur avec cet email possède déjà un compte actif dans cette organisation.'
          )
        }

        // Utilisateur existant mais pas encore totalement onboardé : on recrée un token et on renvoie le lien.
        userId = existingUser.id
        const token = await OnboardingToken.createForUser(existingUser.id)
        await sendOnboardingEmail(existingUser, token, options.baseUrl)
      } else {
        // Aucun utilisateur encore existant : on crée le compte et le token.
        const temporaryPassword = await hash.make(randomPassword())
        const user = await User.create({
          organizationId: input.organizationId,
          email: input.email,
          name: input.name,
          password: temporaryPassword,
          role: USERS_ROLES.EMPLOYEE,
        })
        userId = user.id
        const token = await OnboardingToken.createForUser(user.id)
        await sendOnboardingEmail(user, token, options.baseUrl)
      }
    }

    const employee = await Employee.create({
      organizationId: input.organizationId,
      advisorId: input.advisorId ?? null,
      userId,
      name: input.name,
      email: input.email,
      currentRole: input.currentRole ?? '',
      targetRole: input.targetRole ?? null,
      summary: input.summary ?? null,
      advisorNotes: null,
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
      onboarded: typeof payload.onboarded === 'boolean' ? payload.onboarded : employee.onboarded,
      nextAppointment: payload.nextAppointment
        ? DateTime.fromISO(payload.nextAppointment)
        : employee.nextAppointment,
    })

    return employee
  }
}
