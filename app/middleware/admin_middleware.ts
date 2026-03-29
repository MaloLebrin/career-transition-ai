import { isAdmin } from '#shared/helpers/roles'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Restricts access to users with admin or super_admin role.
 * Must be used after auth middleware (user is guaranteed to exist).
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !isAdmin(user.role)) {
      return ctx.response.forbidden({ message: 'Accès réservé aux administrateurs.' })
    }
    return next()
  }
}
