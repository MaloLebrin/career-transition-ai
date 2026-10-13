import { denyAccess } from '#utils/forbidden_response'
import { isSuperAdmin } from '#shared/helpers/roles'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SuperAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth?.user
    if (!user || !isSuperAdmin(user.role)) {
      return denyAccess(ctx, 'Accès réservé aux super administrateurs.')
    }
    return next()
  }
}
