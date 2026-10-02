import type OnboardingToken from '#models/onboarding_token'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import type { MailAddress } from '#services/mail/types'
import env from '#start/env'
import { appUrl } from '#utils/app_url'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

/** Durée de validité du lien de vérification (#98) ; reprise dans le texte de l'e-mail. */
export const EMAIL_VERIFICATION_TOKEN_TTL_DAYS = 7

function resolveFromAddress(): MailAddress {
  const email = String(env.get('MAIL_FROM_EMAIL') ?? '').trim()
  const name = String(env.get('MAIL_FROM_NAME') ?? '').trim()

  if (email) {
    return { email, name: name || undefined }
  }

  if (!app.inProduction) {
    return { email: 'onboarding@resend.dev', name: 'Inscription' }
  }

  throw new Error('MAIL_FROM_EMAIL is required in production to send emails.')
}

/**
 * E-mail de vérification d'adresse des particuliers (#98). Le lien vient
 * d'`APP_URL`, jamais de la requête (#64), et ne porte que le secret du jeton
 * dont la base garde l'empreinte (#65).
 */
@inject()
export class EmailVerificationMailService {
  constructor(private mail: MailService) {}

  public async sendVerificationLink({
    user,
    token,
  }: {
    user: User
    token: OnboardingToken
  }): Promise<void> {
    if (!token.plainToken) {
      throw new Error('Email verification secret is only available right after createForUser().')
    }
    const link = appUrl(`/auth/verify-email/${token.plainToken}`)

    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: user.email, name: user.name },
      subject: 'Confirmez votre adresse e-mail',
      text: [
        `Bonjour ${user.name},`,
        '',
        'Merci pour votre inscription. Cliquez sur ce lien pour confirmer votre adresse e-mail :',
        link,
        '',
        `Ce lien est valable ${EMAIL_VERIFICATION_TOKEN_TTL_DAYS} jours et ne sert qu’une fois.`,
        'Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail.',
      ].join('\n'),
      tags: ['email_verification'],
      metadata: { kind: 'email_verification', userId: user.id },
    })
  }
}
