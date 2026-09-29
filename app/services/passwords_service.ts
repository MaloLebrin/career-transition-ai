import {
  InvalidCurrentPasswordError,
  InvalidPasswordResetTokenError,
} from '#exceptions/password_errors'
import { SuperAdminUserNotFoundError } from '#exceptions/super_admin_user_errors'
import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import { reportError } from '#services/error_tracking_service'
import { PasswordMailService } from '#services/mail/password_mail_service'
import type { ChangePasswordInput } from '#shared/types/auth/password'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

/**
 * Mots de passe (#68) : « mot de passe oublié » en libre-service, lien de
 * réinitialisation envoyé par le super admin, changement une fois connecté.
 *
 * Les liens ne portent qu'un secret dont la base stocke l'empreinte
 * (`PasswordResetToken`), valable 1 h et une seule fois. Aucun mot de passe
 * n'est jamais généré ni affiché.
 */
@inject()
export class PasswordsService {
  constructor(private mails: PasswordMailService) {}

  /**
   * Envoie un lien de réinitialisation si un compte porte cet e-mail. Ne dit
   * jamais si le compte existe (ni par le retour, ni par une erreur d'envoi) :
   * le contrôleur répond le même message dans tous les cas.
   */
  public async requestReset(email: string): Promise<void> {
    const user = await User.query()
      .whereRaw('lower(email) = ?', [email.trim().toLowerCase()])
      .first()
    if (!user) return

    try {
      await this.sendResetLink(user)
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'password reset email failed')
      reportError(error, { userId: user.id, tags: { kind: 'password_reset' } })
    }
  }

  /** Super admin : envoie un lien de réinitialisation au compte ciblé. */
  public async sendResetLinkTo(userId: number): Promise<User> {
    const user = await User.find(userId)
    if (!user) throw new SuperAdminUserNotFoundError()

    await this.sendResetLink(user)
    return user
  }

  /** Jeton correspondant au secret du lien, avec son utilisateur, ou `null`. */
  public async findByPlainToken(plainToken: string): Promise<PasswordResetToken | null> {
    if (!plainToken) return null
    const record = await PasswordResetToken.query()
      .where('token', PasswordResetToken.hash(plainToken))
      .preload('user')
      .first()
    return record?.user ? record : null
  }

  /**
   * Enregistre le nouveau mot de passe choisi depuis le lien et invalide tous
   * les liens du compte, puis envoie l'e-mail de confirmation.
   */
  public async resetWithToken(plainToken: string, password: string): Promise<User> {
    const record = await this.findByPlainToken(plainToken)
    if (!record || !record.isValid()) throw new InvalidPasswordResetTokenError()

    const user = await db.transaction(async (trx) => {
      const account = record.user
      account.useTransaction(trx)
      // En clair : le hook `beforeSave` de `withAuthFinder` le hashe.
      account.password = password
      // Le lien prouve l'accès à la boîte mail, comme celui de l'onboarding.
      account.onboardingCompletedAt ??= DateTime.now()
      await account.save()
      await this.invalidateTokens(account.id, trx)
      return account
    })

    await this.notifyChanged(user)
    return user
  }

  /** Changement de mot de passe d'un utilisateur connecté, sur preuve de l'actuel. */
  public async change(user: User, input: ChangePasswordInput): Promise<void> {
    const matches = await hash.verify(user.password, input.currentPassword)
    if (!matches) throw new InvalidCurrentPasswordError()

    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      user.password = input.password
      await user.save()
      await this.invalidateTokens(user.id, trx)
    })

    await this.notifyChanged(user)
  }

  private async sendResetLink(user: User): Promise<void> {
    const token = await db.transaction(async (trx) => {
      // Un seul lien actif par compte : le dernier envoyé.
      await this.invalidateTokens(user.id, trx)
      return PasswordResetToken.createForUser(user.id, { client: trx })
    })
    await this.mails.sendResetLink({ user, token })
  }

  private async invalidateTokens(userId: number, trx: TransactionClientContract): Promise<void> {
    await PasswordResetToken.query({ client: trx })
      .where('userId', userId)
      .whereNull('usedAt')
      .update({ usedAt: DateTime.now().toSQL() })
  }

  /**
   * Confirmation du changement : un échec d'envoi ne doit pas annuler un mot
   * de passe déjà enregistré.
   */
  private async notifyChanged(user: User): Promise<void> {
    try {
      await this.mails.sendPasswordChanged({ user })
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'password changed email failed')
      reportError(error, { userId: user.id, tags: { kind: 'password_changed' } })
    }
  }
}
