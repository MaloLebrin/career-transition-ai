import type User from '#models/user'

/** Clé de session de la garde `web` (`auth_<garde>`). */
export const SESSION_KEY = 'auth_web'

/** Mot de passe en clair des acteurs passés par `withPassword()`. */
export const PASSWORD = 'secret-password'

/**
 * Pose un mot de passe **en clair** connu sur un acteur, hashé une seule fois
 * par le hook `beforeSave` de `withAuthFinder` — comme à l'inscription. Ne
 * jamais y affecter un `hash.make(...)` : il serait hashé une seconde fois.
 */
export async function withPassword(user: User, password: string = PASSWORD): Promise<User> {
  user.password = password
  await user.save()
  return user
}
