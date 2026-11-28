import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import User from '#models/user'
import type { UserEmailCheckOptions } from '#shared/types/auth/user_email'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Unicité des e-mails de compte (#169) : une adresse appartient à un seul
 * compte sur toute la plateforme, sans tenir compte de la casse — comme la
 * connexion et le mot de passe oublié, qui cherchent sans organisation.
 * Garantie en base par l'index unique `users_email_lower_unique`
 * (`users (lower(email))`) ; ce service donne l'erreur de domaine avant
 * l'insertion. Tout service qui crée un compte ou en change l'adresse passe par lui.
 */
export class UserEmailService {
  /** Forme de comparaison d'une adresse : sans espaces, en minuscules. */
  public static normalize(email: string): string {
    return email.trim().toLowerCase()
  }

  /** Compte qui porte cette adresse (casse ignorée), unique par construction. */
  public async findByEmail(email: string, trx?: TransactionClientContract): Promise<User | null> {
    return User.query({ client: trx })
      .whereRaw('lower(email) = ?', [UserEmailService.normalize(email)])
      .first()
  }

  /** L'adresse est-elle déjà portée par un compte (autre que `exceptUserId`) ? */
  public async isTaken(
    email: string,
    options: UserEmailCheckOptions = {},
    trx?: TransactionClientContract
  ): Promise<boolean> {
    const query = User.query({ client: trx }).whereRaw('lower(email) = ?', [
      UserEmailService.normalize(email),
    ])
    if (options.exceptUserId !== undefined) query.whereNot('id', options.exceptUserId)
    return (await query.first()) !== null
  }

  /** Lance `EmailAlreadyUsedException` (409) si l'adresse est déjà prise. */
  public async assertAvailable(
    email: string,
    options: UserEmailCheckOptions = {},
    trx?: TransactionClientContract
  ): Promise<void> {
    if (await this.isTaken(email, options, trx)) {
      throw new EmailAlreadyUsedException(options.message)
    }
  }
}
