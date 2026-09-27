import type User from '#models/user'

/** Clé de session de la garde `web` (`auth_<garde>`). */
export const SESSION_KEY = 'auth_web'

/** Mot de passe en clair des acteurs passés par `withPassword()`. */
export const PASSWORD = 'secret-password'

/**
 * Pose un mot de passe **en clair** sur un acteur, hashé une seule fois par les
 * hooks du modèle — comme à l'inscription.
 *
 * Le hash pré-calculé de `UserFactory` (`hash.make('password')`) est re-hashé
 * par le hook `beforeSave` du mixin `withAuthFinder` : un acteur de la factory
 * ne peut donc pas se connecter avec `password`.
 */
export async function withPassword(user: User, password: string = PASSWORD): Promise<User> {
  user.password = password
  await user.save()
  return user
}
