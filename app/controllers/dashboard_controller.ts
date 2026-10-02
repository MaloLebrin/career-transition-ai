import Employee from '#models/employee'
import { EmployeesService } from '#services/employees_service'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { getExerciseProgressByType } from '#shared/helpers/exercise_progress'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import EmployeeTransformer from '#transformers/employee_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

/**
 * Redirects authenticated user to the correct dashboard area based on role.
 */
@inject()
export default class DashboardController {
  constructor(
    private employeesService: EmployeesService,
    private exerciseAccess: ExerciseAccessService
  ) {}

  public async index({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    switch (user.role) {
      case USERS_ROLES.EMPLOYEE:
        return response.redirect('/dashboard/candidat')
      case USERS_ROLES.ADVISOR:
      case USERS_ROLES.ADMIN:
        return response.redirect('/dashboard/conseiller')
      case USERS_ROLES.SUPER_ADMIN:
        return response.redirect('/dashboard/super-admin')
      default:
        return response.redirect('/dashboard/conseiller')
    }
  }

  /**
   * Advisor/admin dashboard home (Inertia).
   */
  public async advisorHome({ inertia, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const query = Employee.query().preload('supportPlanSteps', (q) =>
      q.preload('exercises').orderBy('scheduled_at', 'asc')
    )

    if (user.role === USERS_ROLES.ADVISOR) {
      query.where('advisorId', user.id)
    } else {
      query.where('organizationId', user.organizationId)
    }

    const employees = await query

    const now = DateTime.now()
    const startOfMonth = now.startOf('month')

    let totalActive = 0
    let pendingOnboarding = 0
    let upcomingCount = 0
    let completedStepsThisMonth = 0

    const accompaniments: any[] = []
    const upcomingAppointments: any[] = []

    for (const employee of employees) {
      if (employee.status === EMPLOYEES_STATUS.ACTIVE) totalActive++
      if (!employee.onboarded) pendingOnboarding++

      const steps = employee.supportPlanSteps ?? []
      const totalSteps = steps.length
      const completedSteps = steps.filter((s) => s.completed).length
      const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

      for (const step of steps) {
        if (step.completed && step.updatedAt.toMillis() >= startOfMonth.toMillis()) {
          completedStepsThisMonth++
        }
        if (
          step.status === APPOINTMENTS_STATUSES.SCHEDULED &&
          step.scheduledAt &&
          step.scheduledAt > now
        ) {
          upcomingCount++
          upcomingAppointments.push({
            stepId: step.id,
            employeeId: employee.id,
            employeeName: employee.name,
            title: step.title,
            scheduledAt: step.scheduledAt.toISO()!,
            locationOrLink: step.locationOrLink,
          })
        }
      }

      const nextStep =
        steps.find(
          (s) =>
            s.status === APPOINTMENTS_STATUSES.SCHEDULED && s.scheduledAt && s.scheduledAt > now
        ) ?? null

      accompaniments.push({
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        status: employee.status,
        onboarded: employee.onboarded,
        targetRole: employee.targetRole,
        completedSteps,
        totalSteps,
        progressPercent,
        nextAppointment: nextStep
          ? {
              stepId: nextStep.id,
              title: nextStep.title,
              scheduledAt: nextStep.scheduledAt!.toISO()!,
            }
          : null,
      })
    }

    upcomingAppointments.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )

    accompaniments.sort((a, b) => {
      if (a.status === EMPLOYEES_STATUS.ACTIVE && b.status !== EMPLOYEES_STATUS.ACTIVE) return -1
      if (b.status === EMPLOYEES_STATUS.ACTIVE && a.status !== EMPLOYEES_STATUS.ACTIVE) return 1
      return a.name.localeCompare(b.name, 'fr')
    })

    return (inertia as any).render('dashboard/conseiller/home/Home', {
      stats: { totalActive, pendingOnboarding, upcomingCount, completedStepsThisMonth },
      accompaniments,
      upcomingAppointments: upcomingAppointments.slice(0, 10),
    })
  }

  /**
   * Candidat dashboard home (Inertia).
   */
  public async candidatHome({ inertia, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.findEmployeeForUser(user, { withAdvisor: true })

    if (!employee) {
      return response.unauthorized()
    }

    const latestStatusByType = new Map<string, { status: string; date: string }>()
    for (const result of employee.exerciseResults || []) {
      const type = String(result.type)
      const date = result.date ? result.date.toISO()! : (result.updatedAt?.toISO() ?? '')
      const current = latestStatusByType.get(type)

      if (!current || date > current.date) {
        latestStatusByType.set(type, { status: String(result.status), date })
      }
    }

    let completedExercises = 0
    for (const latest of latestStatusByType.values()) {
      if (latest.status === 'completed') {
        completedExercises += 1
      }
    }

    const totalExercises = EXERCISE_LIST.length
    const exerciseCompletionPercent =
      totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
    const exerciseProgressByType = getExerciseProgressByType(employee.exerciseResults as any)

    return (inertia as any).render('dashboard/employee/home/Home', {
      employee: EmployeeTransformer.transform(employee),
      completedExercises,
      totalExercises,
      exerciseCompletionPercent,
      exerciseProgressByType,
      // #100 : expert assigné (nom seul) et accès aux exercices (plan ou forfait).
      advisor: employee.advisor ? { name: employee.advisor.name } : null,
      exerciseAccess: await this.exerciseAccess.resolve(employee),
    })
  }

  /**
   * Candidat dashboard onboarding (Inertia).
   */
  public async candidatOnboarding({ inertia, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const employee = await Employee.query()
      .where('user_id', user.id)
      .preload('skills')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))
      .preload('experiences')
      .preload('educations')
      .first()

    if (!employee) {
      return response.unauthorized()
    }

    if (employee.onboarded) {
      return response.redirect('/dashboard/candidat')
    }

    return (inertia as any).render('dashboard/employee/onboarding/Onboarding', {
      employee: EmployeeTransformer.transform(employee),
    })
  }
}
