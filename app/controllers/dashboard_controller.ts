import Employee from '#models/employee'
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
      .preload('supportPlanSteps')
      .preload('experiences')
      .preload('educations')
      .first()

    if (!employee) {
      return response.unauthorized()
    }

    return (inertia as any).render('dashboard/employee/home/Home', {
      employee: EmployeeTransformer.transform(employee),
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
      .preload('supportPlanSteps')
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
