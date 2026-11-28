import {
  EmailAlreadyVerifiedError,
  EmailChangeConflictError,
  EmailChangeLinkNotSentError,
} from '#exceptions/email_verification_errors'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { reportError } from '#services/error_tracking_service'
import {
  EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
  EmailVerificationMailService,
} from '#services/mail/email_verification_mail_service'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import type { EmailVerificationResult } from '#shared/types/auth/email_change'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

/**
 * Vérification de l'adresse e-mail des particuliers (#98) : prérequis au
 * paiement (factures Stripe, liens de réinitialisation), jamais au parcours
 * gratuit. Réutilise `OnboardingToken` (secret haché, expirant, à usage
 * unique) : un seul lien actif par compte, le dernier envoyé.
 *
 * Changement d'e-mail (#143) : même mécanisme, mais le lien part vers la
 * nouvelle adresse (`OnboardingToken.newEmail`) et ne la substitue à
 * l'ancienne qu'au clic. L'ancienne adresse est ensuite prévenue.
 */
@inject()
export class EmailVerificationService {
  constructor(
    private mails: EmailVerificationMailService,
    private tokens: OnboardingTokensService
  ) {}

  /**
   * Crée un nouveau lien de vérification et l'envoie. Les précédents liens de
   * vérification (ou d'onboarding) non consommés sont invalidés ; une demande
   * de changement d'e-mail en cours (`newEmail`) est conservée.
   */
  public async sendLink(user: User): Promise<void> {
    const token = await db.transaction(async (trx) => {
      await OnboardingToken.query({ client: trx })
        .where('userId', user.id)
        .whereNull('newEmail')
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
   * Demande de changement d'e-mail (#143) : envoie un lien à la nouvelle
   * adresse, l'adresse du compte reste inchangée jusqu'au clic. Renvoie
   * l'adresse en attente, ou `null` si elle ne diffère pas de l'actuelle —
   * auquel cas une demande précédente est annulée : remettre son adresse
   * actuelle dans le formulaire revient sur un changement saisi par erreur.
   */
  public async requestEmailChange(user: User, newEmail: string): Promise<string | null> {
    // En minuscules : la connexion compare l'adresse saisie à celle du compte.
    const email = newEmail.trim().toLowerCase()
    if (email === user.email.toLowerCase()) {
      await this.cancelPendingEmailChanges(user)
      return null
    }
    if (await this.isTakenByAnother(user, email)) throw new EmailChangeConflictError()

    const token = await db.transaction(async (trx) => {
      // Une seule demande en cours : la dernière adresse saisie l'emporte.
      await this.cancelPendingEmailChanges(user, trx)
      return OnboardingToken.createForUser(user.id, {
        expiresInDays: EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
        newEmail: email,
        client: trx,
      })
    })
    try {
      await this.mails.sendEmailChangeLink({ user, token })
    } catch (error) {
      // Pas de « confirmation en attente » pour un lien qui n'est jamais parti.
      token.usedAt = DateTime.now()
      await token.save()
      logger.error({ err: error, userId: user.id }, 'email change link failed')
      reportError(error, { userId: user.id, tags: { kind: 'email_change' } })
      throw new EmailChangeLinkNotSentError()
    }
    return email
  }

  /** Nouvelle adresse en attente de confirmation (#143), ou `null`. */
  public async pendingEmailFor(user: User): Promise<string | null> {
    const token = await OnboardingToken.query()
      .where('userId', user.id)
      .whereNotNull('newEmail')
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .orderBy('id', 'desc')
      .first()
    return token?.newEmail ?? null
  }

  /**
   * Lien cliqué : vérifie l'adresse (ou applique la nouvelle, #143) et
   * consomme le jeton. Le contrôleur choisit le message selon l'issue, la
   * requête venant d'un clic dans un e-mail, pas d'Inertia.
   */
  public async verify(plainToken: string): Promise<EmailVerificationResult> {
    const record = await this.tokens.findByPlainToken(plainToken)
    if (!record || !record.isValid()) return { outcome: 'invalid' }
    if (!record.newEmail) {
      await this.tokens.consumeForEmailVerification(record)
      return { outcome: 'verified' }
    }

    const previousEmail = record.user.email
    try {
      const user = await this.tokens.consumeForEmailVerification(record)
      await this.notifyPreviousAddress(user, previousEmail)
      return { outcome: 'email_changed' }
    } catch (error) {
      if (error instanceof EmailChangeConflictError) return { outcome: 'email_taken' }
      throw error
    }
  }

  /** Invalide les liens de changement d'e-mail non consommés de `user`. */
  private async cancelPendingEmailChanges(
    user: User,
    client?: TransactionClientContract
  ): Promise<void> {
    await OnboardingToken.query(client ? { client } : {})
      .where('userId', user.id)
      .whereNotNull('newEmail')
      .whereNull('usedAt')
      .update({ usedAt: DateTime.now().toSQL() })
  }

  private async isTakenByAnother(user: User, email: string): Promise<boolean> {
    const existing = await User.query()
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .whereNot('id', user.id)
      .first()
    return existing !== null
  }

  /** L'adresse a déjà changé : un échec d'envoi de l'avis ne doit pas l'annuler. */
  private async notifyPreviousAddress(user: User, previousEmail: string): Promise<void> {
    try {
      await this.mails.sendEmailChangedNotice({ user, previousEmail })
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'email changed notice failed')
      reportError(error, { userId: user.id, tags: { kind: 'email_change_notice' } })
    }
  }
}
