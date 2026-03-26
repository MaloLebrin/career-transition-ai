import Employee from '#models/employee'
import { getExerciseProgressByType } from '#shared/helpers/exercise_progress'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { USERS_ROLES } from '#shared/constants/user'
import EmployeeTransformer from '#transformers/employee_transformer'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Redirects authenticated user to the correct dashboard area based on role.
 */
export default class DashboardController {
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
   * Candidat dashboard home (Inertia).
   */
  public async candidatHome({ inertia, auth, response }: HttpContext) {
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

