import { MailService } from '#services/mail/mail_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'

export const DEFAULT_ALERT_FROM_EMAIL = 'noreply@transitioncarriere.fr'
export const DEFAULT_ALERT_FROM_NAME = 'Transition Carrière'

/** Lues à l'envoi (et non au chargement du module) pour suivre `env`. */
function resolveAddresses() {
  return {
    fromEmail: env.get('MAIL_FROM_EMAIL')?.trim() || DEFAULT_ALERT_FROM_EMAIL,
    fromName: env.get('MAIL_FROM_NAME')?.trim() || DEFAULT_ALERT_FROM_NAME,
    payment: env.get('PAYMENT_ALERT_EMAIL')?.trim() || null,
    expertRequest: env.get('EXPERT_REQUEST_ALERT_EMAIL')?.trim() || null,
  }
}

export interface PaymentAlertInput {
  paymentId: number
  employeeId: number
  /** Montant réellement encaissé, en centimes. */
  amountCents: number
  discountCents: number
  currency: string
  promoCode: string | null
}

export interface ExpertRequestAlertInput {
  expertRequestId: number
  employeeId: number
  availability: string | null
}

/**
 * Alertes e-mail adressées à l'équipe (hors notifications in-app) : un
 * paiement de forfait encaissé, une demande d'accompagnement par un expert.
 * Chaque alerte part vers sa propre adresse (`PAYMENT_ALERT_EMAIL`,
 * `EXPERT_REQUEST_ALERT_EMAIL`) ; adresse absente → aucun envoi.
 *
 * Aucun nom ni e-mail de candidat : id seulement, comme les notifications de
 * l'équipe (les e-mails survivent à `candidate:purge`, docs/RGPD.md).
 */
@inject()
export class TeamAlertMailService {
  constructor(private mail: MailService) {}

  /** `true` si un e-mail a été envoyé. */
  async paymentReceived(input: PaymentAlertInput): Promise<boolean> {
    const { fromEmail, fromName, payment } = resolveAddresses()
    if (!payment) return false

    const lines = [
      'Un particulier vient de régler son forfait.',
      '',
      `Candidat : #${input.employeeId}`,
      `Paiement : #${input.paymentId}`,
      `Montant encaissé : ${formatAmount(input.amountCents, input.currency)}`,
    ]
    if (input.discountCents > 0) {
      lines.push(`Remise : ${formatAmount(input.discountCents, input.currency)}`)
    }
    if (input.promoCode) lines.push(`Code promo : ${input.promoCode}`)

    await this.mail.send({
      from: { email: fromEmail, name: fromName },
      to: { email: payment, name: fromName },
      subject: `Nouveau paiement — candidat #${input.employeeId}`,
      text: lines.join('\n'),
      tags: ['team-alert', 'payment_received'],
      metadata: { kind: 'payment_received', paymentId: input.paymentId },
    })
    return true
  }

  /** `true` si un e-mail a été envoyé. */
  async expertRequested(input: ExpertRequestAlertInput): Promise<boolean> {
    const { fromEmail, fromName, expertRequest } = resolveAddresses()
    if (!expertRequest) return false

    const lines = [
      'Un particulier demande à être accompagné par un expert.',
      '',
      `Candidat : #${input.employeeId}`,
      `Demande : #${input.expertRequestId}`,
    ]
    if (input.availability) lines.push(`Disponibilités : ${input.availability}`)
    lines.push('', 'À assigner depuis le back-office (demandes d’accompagnement).')

    await this.mail.send({
      from: { email: fromEmail, name: fromName },
      to: { email: expertRequest, name: fromName },
      subject: `Demande d’accompagnement — candidat #${input.employeeId}`,
      text: lines.join('\n'),
      tags: ['team-alert', 'expert_request_created'],
      metadata: { kind: 'expert_request_created', expertRequestId: input.expertRequestId },
    })
    return true
  }
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
