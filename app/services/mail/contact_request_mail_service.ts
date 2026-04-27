import { MailService } from '#services/mail/mail_service'
import { inject } from '@adonisjs/core'

const ADMIN_EMAIL = process.env.ADMIN_CONTACT_EMAIL ?? 'contact@francetransitioncarriere.fr'
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL ?? 'noreply@francetransitioncarriere.fr'
const FROM_NAME = process.env.MAIL_FROM_NAME ?? 'France Transition Carrière'

interface ContactRequestData {
  name: string
  email: string
  phone?: string | null
  organization?: string | null
  message: string
  type: 'contact' | 'demo'
}

@inject()
export class ContactRequestMailService {
  constructor(private mailService: MailService) {}

  async sendAdminNotification(data: ContactRequestData): Promise<void> {
    const typeLabel = data.type === 'demo' ? 'Demande de démo' : 'Prise de contact'

    await this.mailService.send({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: { email: ADMIN_EMAIL, name: FROM_NAME },
      subject: `[${typeLabel}] ${data.name} — ${data.organization ?? data.email}`,
      html: buildAdminHtml(data, typeLabel),
      text: buildAdminText(data, typeLabel),
      tags: ['contact-request', data.type],
    })
  }

  async sendConfirmationToRequester(data: ContactRequestData): Promise<void> {
    const typeLabel = data.type === 'demo' ? 'demande de démo' : 'message'

    await this.mailService.send({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: { email: data.email, name: data.name },
      subject: `Votre ${typeLabel} a bien été reçu — France Transition Carrière`,
      html: buildConfirmationHtml(data, typeLabel),
      text: buildConfirmationText(data, typeLabel),
      tags: ['contact-confirmation', data.type],
    })
  }
}

function buildAdminHtml(data: ContactRequestData, typeLabel: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #1e2f3f; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1e2f3f;">${typeLabel}</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; font-weight: bold; width: 160px;">Nom</td><td>${escapeHtml(data.name)}</td></tr>
    <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
    ${data.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Téléphone</td><td>${escapeHtml(data.phone)}</td></tr>` : ''}
    ${data.organization ? `<tr><td style="padding: 8px 0; font-weight: bold;">Organisation</td><td>${escapeHtml(data.organization)}</td></tr>` : ''}
    <tr><td style="padding: 8px 0; font-weight: bold;">Type</td><td>${typeLabel}</td></tr>
  </table>
  <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;" />
  <h3 style="color: #1e2f3f;">Message</h3>
  <p style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 8px;">${escapeHtml(data.message)}</p>
</body>
</html>
`
}

function buildAdminText(data: ContactRequestData, typeLabel: string): string {
  return [
    typeLabel,
    '',
    `Nom : ${data.name}`,
    `Email : ${data.email}`,
    data.phone ? `Téléphone : ${data.phone}` : null,
    data.organization ? `Organisation : ${data.organization}` : null,
    '',
    'Message :',
    data.message,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function buildConfirmationHtml(data: ContactRequestData, typeLabel: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #1e2f3f; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1e2f3f;">Bonjour ${escapeHtml(data.name)},</h2>
  <p>Nous avons bien reçu votre ${typeLabel} et reviendrons vers vous sous <strong>48h ouvrées</strong>.</p>
  <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;" />
  <p style="color: #6b7280; font-size: 14px;">Récapitulatif de votre message :</p>
  <p style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 8px; font-size: 14px;">${escapeHtml(data.message)}</p>
  <p style="margin-top: 24px;">À bientôt,<br /><strong>L'équipe France Transition Carrière</strong></p>
</body>
</html>
`
}

function buildConfirmationText(data: ContactRequestData, typeLabel: string): string {
  return [
    `Bonjour ${data.name},`,
    '',
    `Nous avons bien reçu votre ${typeLabel} et reviendrons vers vous sous 48h ouvrées.`,
    '',
    'Récapitulatif de votre message :',
    data.message,
    '',
    'À bientôt,',
    "L'équipe France Transition Carrière",
  ].join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
