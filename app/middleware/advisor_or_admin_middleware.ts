import { isAdvisorOrAdmin } from '#shared/helpers/roles'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Restricts access to users with advisor, admin or super_admin role.
 * Must be used after auth middleware (user is guaranteed to exist).
 */
export default class AdvisorOrAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !isAdvisorOrAdmin(user.role)) {
      return ctx.response.forbidden({ message: 'Accès réservé aux conseillers.' })
    }
    return next()
  }
}
