import OnboardingToken from '#models/onboarding_token'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Lecture et consommation des liens d'onboarding (`/onboarding/:token`).
 * Le secret reçu dans l'URL est haché avant la requête : la base ne contient
 * que des empreintes (#65).
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

  /**
   * Enregistre le mot de passe choisi, marque l'onboarding terminé et consomme
   * le jeton, en une transaction.
   */
  public async consume(record: OnboardingToken, password: string): Promise<User> {
    return db.transaction(async (trx) => {
      const user = record.user
      user.useTransaction(trx)
      // En clair : le hook `beforeSave` de `withAuthFinder` le hashe. Un `hash.make()`
      // ici le faisait hasher deux fois — le mot de passe choisi ne fonctionnait pas.
      user.password = password
      user.onboardingCompletedAt = DateTime.now()
      await user.save()

      record.useTransaction(trx)
      record.usedAt = DateTime.now()
      await record.save()
      return user
    })
  }
}
