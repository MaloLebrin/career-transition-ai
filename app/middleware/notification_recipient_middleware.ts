import { denyAccess } from '#utils/forbidden_response'
import { receivesNotifications } from '#shared/helpers/roles'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Restreint les routes de notifications aux rôles qui en reçoivent
 * (`receivesNotifications`, mêmes rôles que la cloche). À placer après `auth()`.
 */
export default class NotificationRecipientMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth?.user
    if (!user || !receivesNotifications(user.role)) {
      return denyAccess(ctx, 'Accès réservé aux destinataires de notifications.')
    }
    return next()
  }
}
