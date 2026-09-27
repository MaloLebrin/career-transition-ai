import type { HttpContext } from '@adonisjs/core/http'
import config from '@adonisjs/core/services/config'
import type { NextFn } from '@adonisjs/core/types/http'

export const REGISTRATION_CLOSED_MESSAGE =
  'Les inscriptions sont fermées. Votre compte vous sera créé par votre cabinet ou par notre équipe.'

/**
 * Ferme `/auth/register` quand l'inscription publique est désactivée
 * (`config/registration.ts`, `REGISTRATION_ENABLED`) : la page n'est plus
 * servie (redirection vers la connexion avec un message) et la création de
 * compte est refusée (403).
 */
export default class RegistrationOpenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (config.get<boolean>('registration.enabled')) {
      return next()
    }

    if (['GET', 'HEAD'].includes(ctx.request.method())) {
      ctx.session.flash('error', REGISTRATION_CLOSED_MESSAGE)
      return ctx.response.redirect('/auth/login')
    }

    return ctx.response.forbidden(REGISTRATION_CLOSED_MESSAGE)
  }
}
