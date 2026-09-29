import { PasswordsService } from '#services/passwords_service'
import { changePasswordValidator } from '#validators/auth/change_password_validator'
import { forgotPasswordValidator } from '#validators/auth/forgot_password_validator'
import { resetPasswordValidator } from '#validators/auth/reset_password_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Réponse identique que le compte existe ou non (pas d'énumération des e-mails). */
export const FORGOT_PASSWORD_SENT_MESSAGE =
  'Si un compte correspond à cette adresse, un lien de réinitialisation vient de lui être envoyé.'

/**
 * Mots de passe (#68) : « mot de passe oublié », réinitialisation par lien,
 * changement une fois connecté et lien envoyé par le super admin.
 */
@inject()
export default class PasswordsController {
  constructor(private passwords: PasswordsService) {}

  /** GET /auth/forgot-password */
  public async showForgot({ inertia }: HttpContext) {
    return inertia.render('auth/ForgotPassword', {})
  }

  /** POST /auth/forgot-password */
  public async sendForgot({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    await this.passwords.requestReset(email)

    session.flash('success', FORGOT_PASSWORD_SENT_MESSAGE)
    return response.redirect().back()
  }

  /** GET /auth/password-reset/:token */
  public async showReset({ params, inertia }: HttpContext) {
    const record = await this.passwords.findByPlainToken(String(params.token))
    if (!record || !record.isValid()) {
      return inertia.render('auth/ResetPassword', {
        token: null,
        expired: Boolean(record && !record.usedAt),
      })
    }

    return inertia.render('auth/ResetPassword', { token: String(params.token), expired: false })
  }

  /** POST /auth/password-reset/:token */
  public async reset({ params, request, response, session }: HttpContext) {
    const { password } = await request.validateUsing(resetPasswordValidator)
    await this.passwords.resetWithToken(String(params.token), password)

    session.flash('success', 'Mot de passe modifié. Vous pouvez vous connecter.')
    return response.redirect('/auth/login')
  }

  /** PUT /dashboard/password — utilisateur connecté, tous rôles. */
  public async update({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(changePasswordValidator)
    await this.passwords.change(auth.getUserOrFail(), {
      currentPassword: payload.current_password,
      password: payload.password,
    })

    session.flash('success', 'Mot de passe modifié.')
    return response.redirect().back()
  }

  /** POST /auth/reset-password/:id — super admin : envoie un lien, n'affiche aucun mot de passe. */
  public async sendResetLink({ params, response, session }: HttpContext) {
    const user = await this.passwords.sendResetLinkTo(Number(params.id))

    session.flash('success', `Lien de réinitialisation envoyé à ${user.name}.`)
    return response.redirect().back()
  }
}
