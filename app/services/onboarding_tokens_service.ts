import { EmailChangeConflictError } from '#exceptions/email_verification_errors'
import Employee from '#models/employee'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

/**
 * Lecture et consommation des liens d'onboarding (`/onboarding/:token`) et de
 * vérification d'e-mail (`/auth/verify-email/:token`, #98) : même table, même
 * secret haché (#65), consommation différente. Le secret reçu dans l'URL est
 * haché avant la requête : la base ne contient que des empreintes.
 *
 * Un lien de changement d'e-mail (#143, `newEmail` renseigné) part vers une
 * adresse qui n'est pas encore celle du compte : il ne vaut jamais lien
 * d'onboarding (`findForOnboarding`), sans quoi son destinataire pourrait
 * choisir le mot de passe du compte.
 */
export class OnboardingTokensService {
  /** Jeton correspondant au secret du lien, avec son utilisateur, ou `null`. */
  public async findByPlainToken(plainToken: string): Promise<OnboardingToken | null> {
    if (!plainToken) return null
    const record = await OnboardingToken.query()
      .where('token', OnboardingToken.hash(plainToken))
      .preload('user')
      .first()
    return record?.user ? record : null
  }

  /** Comme `findByPlainToken`, sans les liens de changement d'e-mail (#143). */
  public async findForOnboarding(plainToken: string): Promise<OnboardingToken | null> {
    const record = await this.findByPlainToken(plainToken)
    return record && !record.newEmail ? record : null
  }

  /**
   * Enregistre le mot de passe choisi, marque l'onboarding terminé et consomme
   * le jeton, en une transaction. Le lien prouve l'accès à la boîte mail : il
   * vaut aussi vérification de l'adresse (#98).
   */
  public async consume(record: OnboardingToken, password: string): Promise<User> {
    return db.transaction(async (trx) => {
      const user = record.user
      user.useTransaction(trx)
      // En clair : le hook `beforeSave` de `withAuthFinder` le hashe. Un `hash.make()`
      // ici le faisait hasher deux fois — le mot de passe choisi ne fonctionnait pas.
      user.password = password
      user.onboardingCompletedAt = DateTime.now()
      user.emailVerifiedAt ??= DateTime.now()
      await user.save()

      await this.markUsed(record, trx)
      return user
    })
  }

  /**
   * Vérification d'e-mail (#98) : pose `emailVerifiedAt` et consomme le jeton,
   * sans toucher au mot de passe ni à l'onboarding. Idempotent pour une
   * adresse déjà vérifiée (le jeton est consommé quand même).
   */
  public async consumeForEmailVerification(record: OnboardingToken): Promise<User> {
    return db.transaction(async (trx) => {
      const user = record.user
      user.useTransaction(trx)
      if (record.newEmail) {
        await this.applyNewEmail(user, record.newEmail, trx)
        user.emailVerifiedAt = DateTime.now()
      } else {
        user.emailVerifiedAt ??= DateTime.now()
      }
      await user.save()

      await this.markUsed(record, trx)
      return user
    })
  }

  /**
   * Changement d'e-mail (#143) : l'adresse a pu être prise entre l'envoi du
   * lien et le clic. La fiche candidat, qui en garde une copie, suit.
   */
  private async applyNewEmail(
    user: User,
    newEmail: string,
    trx: TransactionClientContract
  ): Promise<void> {
    const taken = await User.query({ client: trx })
      .whereRaw('LOWER(email) = ?', [newEmail.toLowerCase()])
      .whereNot('id', user.id)
      .first()
    if (taken) throw new EmailChangeConflictError()

    user.email = newEmail
    await Employee.query({ client: trx }).where('userId', user.id).update({ email: newEmail })
  }

  private async markUsed(record: OnboardingToken, trx: TransactionClientContract): Promise<void> {
    record.useTransaction(trx)
    record.usedAt = DateTime.now()
    await record.save()
  }
}
