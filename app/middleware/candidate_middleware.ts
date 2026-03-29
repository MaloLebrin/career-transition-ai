import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Restricts access to users with employee (candidate) role.
 * Must be used after auth middleware (user is guaranteed to exist).
 */
export default class CandidateMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || user.role !== USERS_ROLES.EMPLOYEE) {
      return ctx.response.forbidden({ message: 'Accès réservé aux candidats.' })
    }
    return next()
  }
}
