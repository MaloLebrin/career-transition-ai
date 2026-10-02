import type { HttpContext } from '@adonisjs/core/http'
import config from '@adonisjs/core/services/config'
import type { NextFn } from '@adonisjs/core/types/http'

export const REGISTRATION_CLOSED_MESSAGE =
  'Les inscriptions sont fermées. Votre compte vous sera créé par votre cabinet ou par notre équipe.'

export const B2C_REGISTRATION_CLOSED_MESSAGE =
  'Les inscriptions des particuliers ne sont pas encore ouvertes.'

/** Formulaire d'inscription gardé : conseiller (`/auth/register`) ou particulier (`/inscription`). */
export type RegistrationKind = 'advisor' | 'candidate'

export type RegistrationOpenOptions = {
  /** `advisor` par défaut (compatibilité des routes existantes). */
  kind?: RegistrationKind
}

const CONFIG_KEY: Record<RegistrationKind, string> = {
  advisor: 'registration.enabled',
  candidate: 'registration.candidateEnabled',
}

const CLOSED_MESSAGE: Record<RegistrationKind, string> = {
  advisor: REGISTRATION_CLOSED_MESSAGE,
  candidate: B2C_REGISTRATION_CLOSED_MESSAGE,
}

/**
 * Ferme un formulaire d'inscription publique quand son flag est désactivé
 * (`config/registration.ts` : `REGISTRATION_ENABLED` pour les conseillers,
 * `B2C_REGISTRATION_ENABLED` pour les particuliers, #93) : la page n'est plus
 * servie (redirection vers la connexion avec un message) et la création de
 * compte est refusée (403).
 */
export default class RegistrationOpenMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: RegistrationOpenOptions = {}) {
    const kind = options.kind ?? 'advisor'
    if (config.get<boolean>(CONFIG_KEY[kind])) {
      return next()
    }

    if (['GET', 'HEAD'].includes(ctx.request.method())) {
      ctx.session.flash('error', CLOSED_MESSAGE[kind])
      return ctx.response.redirect('/auth/login')
    }

    return ctx.response.forbidden(CLOSED_MESSAGE[kind])
  }
}
