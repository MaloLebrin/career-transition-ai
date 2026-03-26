import type { EmployeeDto } from '#dtos/employee_dto'
import { mapEmployee } from '#domains/employees/mappers/employee_mapper'
import Employee from '#models/employee'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { OnboardingMailService } from '#domains/onboarding/services/onboarding_mail_service'
import { EmployeeStatus } from '#shared/constants/employee'
import { USERS_ROLES } from '#shared/constants/user'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'

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
  status?: EmployeeStatus
  targetRole?: string
  summary?: string
  name?: string
  currentRole?: string
  onboarded?: boolean
}

function randomPassword(): string {
  return Math.random().toString(36).slice(-16) + Date.now().toString(36)
}

@inject()
export class EmployeesService {
  constructor(private onboardingMailService: OnboardingMailService) {}

  /**
   * (Re)sends the onboarding link for an existing employee.
   * - Ensures there is a linked User (creates one if missing)
   * - Creates a fresh onboarding token
   * - Sends/logs the onboarding email
   */
  public async resendOnboardingLink(employee: Employee, baseUrl: string): Promise<void> {
    if (employee.onboarded) {
      throw new Error('Ce candidat a déjà terminé son onboarding.')
    }

    let user: User | null = null

    if (employee.userId) {
      user = await User.query()
        .where('id', employee.userId)
        .where('organizationId', employee.organizationId)
        .first()
    }

    if (!user) {
      user = await User.query()
        .where('organizationId', employee.organizationId)
        .where('email', employee.email)
        .first()
    }

    if (!user) {
      const temporaryPassword = await hash.make(randomPassword())
      user = await User.create({
        organizationId: employee.organizationId,
        email: employee.email,
        name: employee.name,
        password: temporaryPassword,
        role: USERS_ROLES.EMPLOYEE,
      })
    }

    if (!employee.userId) {
      employee.userId = user.id
      await employee.save()
    }

    const token = await OnboardingToken.createForUser(user.id)
    await this.onboardingMailService.sendSetPasswordLink({ user, token, baseUrl })
  }

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
        await this.onboardingMailService.sendSetPasswordLink({
          user: existingUser,
          token,
          baseUrl: options.baseUrl,
        })
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
        await this.onboardingMailService.sendSetPasswordLink({
          user,
          token,
          baseUrl: options.baseUrl,
        })
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
    })

    await employee.load('skills', (q) => q.pivotColumns(['level']))
    await employee.load('experiences')
    await employee.load('educations')
    await employee.load('exerciseResults')
    await employee.load('supportPlanSteps')

    return mapEmployee(employee)
  }

  /**
   * Get the employee record linked to the given user (candidate self-service).
   */
  public async getEmployeeForUser(user: User): Promise<Employee> {
    // TODO: optimise this function
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))
      .first()

    if (!employee) {
      throw new Error('Profil candidat introuvable.')
    }

    return employee
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
    })

    return employee
  }
}

