import type { HttpContext } from '@adonisjs/core/http'
import { USERS_ROLES } from '#models/user'

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
  public async candidatHome({ inertia }: HttpContext) {
    return (inertia as any).render('dashboard/Home', { dashboardContext: 'candidat' })
  }
}
