import type { EmployeeDto } from '#dtos/employee_dto'
import { mapEmployee } from '#mappers/employee_mapper'
import EmployeeAlreadyExistsException from '#exceptions/employee_already_exists_exception'
import Employee from '#models/employee'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { CreateEmployeeInput, UpdateEmployeeInput } from '#shared/types/employee/inputs'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

type CreateEmployeeOptions = {
  /** When set, a User account is created and an onboarding link is sent (e.g. by email). */
  baseUrl?: string
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
      const temporaryPassword = randomPassword()
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
    const baseUrl = options?.baseUrl

    let existingUser: User | null = null
    if (baseUrl) {
      existingUser = await User.query()
        .where('organizationId', input.organizationId)
        .where('email', input.email)
        .first()

      if (existingUser) {
        // Une fiche existe déjà pour ce compte (ou cet email) dans l'organisation :
        // on n'en crée pas une seconde (`employees.user_id` est unique). Si le
        // candidat n'a pas fini son onboarding, le conseiller renvoie le lien
        // depuis sa fiche (`resendOnboardingLink`).
        const userId = existingUser.id
        const existingEmployee = await Employee.query()
          .where('organizationId', input.organizationId)
          .where((q) => q.where('userId', userId).orWhere('email', input.email))
          .first()

        if (existingEmployee) {
          throw new EmployeeAlreadyExistsException({ onboarded: existingEmployee.onboarded })
        }
      }
    }

    // Compte + fiche en une transaction ; le lien d'onboarding n'est envoyé
    // qu'une fois la fiche enregistrée, jamais pour une création avortée.
    const { employee, user } = await db.transaction(async (trx) => {
      let account: User | null = existingUser
      if (baseUrl && !account) {
        // Aucun utilisateur encore existant : on crée le compte.
        account = await User.create(
          {
            organizationId: input.organizationId,
            email: input.email,
            name: input.name,
            password: randomPassword(),
            role: USERS_ROLES.EMPLOYEE,
          },
          { client: trx }
        )
      }

      const created = await Employee.create(
        {
          organizationId: input.organizationId,
          advisorId: input.advisorId ?? null,
          userId: account?.id ?? null,
          name: input.name,
          email: input.email,
          currentRole: input.currentRole ?? '',
          targetRole: input.targetRole ?? null,
          summary: input.summary ?? null,
          advisorNotes: null,
          onboarded: false,
        },
        { client: trx }
      )

      return { employee: created, user: account }
    })

    if (baseUrl && user) {
      // Compte neuf, ou compte existant sans fiche candidat : nouveau token + lien.
      const token = await OnboardingToken.createForUser(user.id)
      await this.onboardingMailService.sendSetPasswordLink({ user, token, baseUrl })
    }

    await employee.load('skills', (q) => q.pivotColumns(['level']))
    await employee.load('experiences')
    await employee.load('educations')
    await employee.load('exerciseResults')
    await employee.load('supportPlanSteps')

    return mapEmployee(employee)
  }

  /**
   * Find the employee record linked to the given user, or null when the user has none
   * (e.g. an advisor or admin).
   */
  public async findEmployeeForUser(user: User): Promise<Employee | null> {
    // TODO: optimise this function
    return Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))
      .first()
  }

  /**
   * Get the employee record linked to the given user (candidate self-service).
   */
  public async getEmployeeForUser(user: User): Promise<Employee> {
    const employee = await this.findEmployeeForUser(user)

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
