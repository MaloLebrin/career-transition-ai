import type PasswordResetToken from '#models/password_reset_token'
import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '#models/password_reset_token'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import type { MailAddress } from '#services/mail/types'
import env from '#start/env'
import { appUrl } from '#utils/app_url'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

function resolveFromAddress(): MailAddress {
  const email = String(env.get('MAIL_FROM_EMAIL') ?? '').trim()
  const name = String(env.get('MAIL_FROM_NAME') ?? '').trim()

  if (email) {
    return { email, name: name || undefined }
  }

  if (!app.inProduction) {
    return { email: 'security@resend.dev', name: 'Sécurité' }
  }

  throw new Error('MAIL_FROM_EMAIL is required in production to send emails.')
}

/**
 * E-mails liés au mot de passe (#68) : lien de réinitialisation et
 * confirmation de changement. Le lien vient d'`APP_URL`, jamais de la requête.
 */
@inject()
export class PasswordMailService {
  constructor(private mail: MailService) {}

  public async sendResetLink({
    user,
    token,
  }: {
    user: User
    token: PasswordResetToken
  }): Promise<void> {
    if (!token.plainToken) {
      throw new Error('Password reset secret is only available right after createForUser().')
    }
    const link = appUrl(`/auth/password-reset/${token.plainToken}`)

    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: user.email, name: user.name },
      subject: 'Réinitialisez votre mot de passe',
      text: [
        `Bonjour ${user.name},`,
        '',
        'Une réinitialisation du mot de passe de votre compte a été demandée. Cliquez sur ce lien pour en choisir un nouveau :',
        link,
        '',
        `Ce lien est valable ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes et ne sert qu’une fois.`,
        'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.',
      ].join('\n'),
      tags: ['password_reset'],
      metadata: { kind: 'password_reset', userId: user.id },
    })
  }

  public async sendPasswordChanged({ user }: { user: User }): Promise<void> {
    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: user.email, name: user.name },
      subject: 'Votre mot de passe a été modifié',
      text: [
        `Bonjour ${user.name},`,
        '',
        'Le mot de passe de votre compte vient d’être modifié.',
        '',
        'Si vous n’êtes pas à l’origine de ce changement, réinitialisez-le immédiatement depuis cette page et prévenez votre conseiller :',
        appUrl('/auth/forgot-password'),
      ].join('\n'),
      tags: ['password_changed'],
      metadata: { kind: 'password_changed', userId: user.id },
    })
  }
}
