import { EmailVerificationService } from '#services/email_verification_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { EmailVerificationOutcome } from '#shared/types/auth/email_change'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export const EMAIL_VERIFIED_MESSAGE = 'Votre adresse e-mail est confirmée.'
export const EMAIL_VERIFICATION_INVALID_MESSAGE =
  'Ce lien de confirmation est invalide ou a expiré. Demandez-en un nouveau depuis votre espace.'
export const EMAIL_VERIFICATION_SENT_MESSAGE =
  'Un nouveau lien de confirmation vient de vous être envoyé par e-mail.'
export const EMAIL_CHANGED_MESSAGE = 'Votre nouvelle adresse e-mail est confirmée.'
export const EMAIL_CHANGE_TAKEN_MESSAGE =
  'Cette adresse e-mail est déjà utilisée par un autre compte : votre adresse n’a pas changé.'

const VERIFY_FLASHES: Record<EmailVerificationOutcome, ['success' | 'error', string]> = {
  verified: ['success', EMAIL_VERIFIED_MESSAGE],
  email_changed: ['success', EMAIL_CHANGED_MESSAGE],
  email_taken: ['error', EMAIL_CHANGE_TAKEN_MESSAGE],
  invalid: ['error', EMAIL_VERIFICATION_INVALID_MESSAGE],
}

/**
 * Vérification d'e-mail des particuliers (#98) : lien cliqué depuis la boîte
 * mail, et renvoi du lien depuis l'espace candidat. Le même lien confirme une
 * nouvelle adresse (#143).
 */
@inject()
export default class EmailVerificationController {
  constructor(private emailVerification: EmailVerificationService) {}

  /**
   * GET /auth/verify-email/:token — invité ou connecté (`silentAuth`). Le
   * message est flashé vers la destination finale, jamais vers `/dashboard`
   * dont la redirection le perdrait.
   */
  public async verify({ params, auth, response, session }: HttpContext) {
    const { outcome } = await this.emailVerification.verify(String(params.token))

    session.flash(...VERIFY_FLASHES[outcome])
    return response.redirect(destinationFor(auth.user))
  }

  /** POST /dashboard/candidat/email-verification/resend — candidat connecté. */
  public async resend({ auth, response, session }: HttpContext) {
    await this.emailVerification.resend(auth.getUserOrFail())

    session.flash('success', EMAIL_VERIFICATION_SENT_MESSAGE)
    return response.redirect().back()
  }
}

function destinationFor(user: { role: string } | undefined): string {
  if (!user) return '/auth/login'
  return user.role === USERS_ROLES.EMPLOYEE ? '/dashboard/candidat' : '/dashboard'
}
