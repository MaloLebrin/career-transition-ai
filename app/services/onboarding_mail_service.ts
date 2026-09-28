import type OnboardingToken from '#models/onboarding_token'
import type Organization from '#models/organization'
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

  // test-first / local dev: allow running without domain verification
  if (!app.inProduction) {
    return { email: 'onboarding@resend.dev', name: 'Onboarding' }
  }

  throw new Error('MAIL_FROM_EMAIL is required in production to send emails.')
}

/**
 * Secret du lien : seule l'instance renvoyée par `OnboardingToken.createForUser`
 * le porte (la base ne stocke que son empreinte, #65).
 */
function plainTokenOf(token: OnboardingToken): string {
  if (!token.plainToken) {
    throw new Error('Onboarding token secret is only available right after createForUser().')
  }
  return token.plainToken
}

@inject()
export class OnboardingMailService {
  constructor(private mail: MailService) {}

  public async sendSetPasswordLink({
    user,
    token,
  }: {
    user: User
    token: OnboardingToken
  }): Promise<void> {
    const link = appUrl(`/onboarding/${plainTokenOf(token)}`)

    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: user.email, name: user.name },
      subject: 'Créez votre mot de passe',
      text: [
        `Bonjour ${user.name},`,
        '',
        'Votre espace est prêt. Cliquez sur ce lien pour créer votre mot de passe :',
        link,
        '',
        'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.',
      ].join('\n'),
      tags: ['onboarding'],
      metadata: { kind: 'onboarding', userId: user.id },
    })
  }

  public async sendInviteAdvisorLink({
    user,
    token,
    organization,
  }: {
    user: User
    organization: Organization
    token: OnboardingToken
  }): Promise<void> {
    const link = appUrl(`/onboarding/${plainTokenOf(token)}`)

    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: user.email, name: user.name },
      subject: `Invitation à rejoindre l'organisation ${organization.name}`,
      text: [
        `Bonjour ${user.name},`,
        '',
        `Vous avez été invité à rejoindre l'organisation ${organization.name}. Cliquez sur ce lien pour accéder à votre espace de travail :`,
        link,
        '',
        'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.',
      ].join('\n'),
      tags: ['onboarding'],
      metadata: { kind: 'onboarding', userId: user.id },
    })
  }
}
