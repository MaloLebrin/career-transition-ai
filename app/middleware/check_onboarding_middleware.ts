import Employee from '#models/employee'
import { USERS_ROLES } from '#shared/constants/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Ensures that the employee has completed their onboarding.
 * Should be used ONLY on candidate routes (after auth & candidate middleware).
 */
export default class CheckOnboardingMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    // If somehow not an employee, skip (though candidate_middleware should prevent this)
    if (!user || user.role !== USERS_ROLES.EMPLOYEE) {
      return next()
    }

    // Get the employee record
    const employee = await Employee.query().where('user_id', user.id).first()

    if (!employee) {
      return ctx.response.unauthorized()
    }

    if (!employee.onboarded) {
      // Redirect to onboarding page if not onboarded
      return ctx.response.redirect('/dashboard/candidat/onboarding')
    }

    return next()
  }
}
