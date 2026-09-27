import { MailService } from '#services/mail/mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import app from '@adonisjs/core/services/app'

/**
 * Faux fournisseur d'emails pour les specs `functional` conseiller / admin.
 *
 * Les invitations et liens d'onboarding passent par `OnboardingMailService`,
 * résolu par le conteneur : on y substitue un `MailService` branché sur ce
 * fournisseur, qui **enregistre** les messages au lieu de les envoyer. Les
 * specs assertent ainsi le destinataire et le lien, sans réseau (Resend) ni
 * bruit console.
 *
 * ```ts
 * const mails = fakeMail()
 * try { ... } finally { restoreMail() }
 * ```
 */
export class RecordingMailProvider implements MailProvider {
  sent: MailMessage[] = []

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message)
  }

  /** Destinataires (emails) de tous les messages, dans l'ordre d'envoi. */
  recipients(): string[] {
    return this.sent.flatMap((m) => (Array.isArray(m.to) ? m.to : [m.to]).map((a) => a.email))
  }
}

export function fakeMail(): RecordingMailProvider {
  const provider = new RecordingMailProvider()
  app.container.swap(MailService, () => MailService.withProvider(provider))
  return provider
}

export function restoreMail(): void {
  app.container.restore(MailService)
}
