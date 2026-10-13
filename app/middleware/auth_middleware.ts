import { AccountDisabledError } from '#exceptions/auth_errors'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/auth/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    // Compte désactivé par le super admin (#73) : la session en cours est coupée.
    if (ctx.auth.user?.disabledAt) {
      await ctx.auth.use('web').logout()
      ctx.session.flash('error', new AccountDisabledError().message)
      return ctx.response.redirect(this.redirectTo)
    }
    return next()
  }
}
