import type OnboardingToken from '#models/onboarding_token'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import { inject } from '@adonisjs/core'

@inject()
export class OnboardingMailService {
  constructor(private mail: MailService) {}

  public async sendSetPasswordLink({
    user,
    token,
    baseUrl,
  }: {
    user: User
    token: OnboardingToken
    baseUrl: string
  }): Promise<void> {
    const link = `${baseUrl}/onboarding/${token.token}`

    await this.mail.send({
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
}

