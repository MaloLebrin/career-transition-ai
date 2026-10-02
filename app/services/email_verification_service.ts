import { EmailAlreadyVerifiedError } from '#exceptions/email_verification_errors'
import OnboardingToken from '#models/onboarding_token'
import type User from '#models/user'
import { reportError } from '#services/error_tracking_service'
import {
  EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
  EmailVerificationMailService,
} from '#services/mail/email_verification_mail_service'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Vérification de l'adresse e-mail des particuliers (#98) : prérequis au
 * paiement (factures Stripe, liens de réinitialisation), jamais au parcours
 * gratuit. Réutilise `OnboardingToken` (secret haché, expirant, à usage
 * unique) : un seul lien actif par compte, le dernier envoyé.
 */
@inject()
export class EmailVerificationService {
  constructor(
    private mails: EmailVerificationMailService,
    private tokens: OnboardingTokensService
  ) {}

  /** Crée un nouveau lien (les précédents non consommés sont invalidés) et l'envoie. */
  public async sendLink(user: User): Promise<void> {
    const token = await db.transaction(async (trx) => {
      await OnboardingToken.query({ client: trx })
        .where('userId', user.id)
        .whereNull('usedAt')
        .update({ usedAt: DateTime.now().toSQL() })
      return OnboardingToken.createForUser(user.id, {
        expiresInDays: EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
        client: trx,
      })
    })
    await this.mails.sendVerificationLink({ user, token })
  }

  /**
   * Après l'inscription : un échec d'envoi (quota, panne du fournisseur) ne
   * doit pas annuler un compte déjà créé. Le candidat peut redemander le lien.
   */
  public async sendLinkSafely(user: User): Promise<void> {
    try {
      await this.sendLink(user)
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'email verification email failed')
      reportError(error, { userId: user.id, tags: { kind: 'email_verification' } })
    }
  }

  /** Renvoi à la demande du candidat connecté. */
  public async resend(user: User): Promise<void> {
    if (user.emailVerifiedAt) throw new EmailAlreadyVerifiedError()
    await this.sendLink(user)
  }

  /**
   * Lien cliqué : vérifie l'adresse et consomme le jeton. `null` pour un
   * secret inconnu, expiré ou déjà utilisé — le contrôleur choisit le message,
   * la requête venant d'un clic dans un e-mail, pas d'Inertia.
   */
  public async verify(plainToken: string): Promise<User | null> {
    const record = await this.tokens.findByPlainToken(plainToken)
    if (!record || !record.isValid()) return null
    return this.tokens.consumeForEmailVerification(record)
  }
}
