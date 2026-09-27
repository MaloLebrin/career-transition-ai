/**
 * Rate limiting des endpoints publics (issue #23) : message affiché et clé
 * d'erreur de formulaire partagés entre le handler d'exceptions et les pages.
 *
 * Une requête Inertia limitée ne reçoit pas un 429 brut (Inertia l'afficherait
 * dans une modale) : le handler flashe le message sous `flash.error` et sous
 * `errors[RATE_LIMIT_ERROR_KEY]`, puis redirige vers la page d'origine. L'erreur
 * de formulaire fait échouer `useForm` (`onError`, pas de `wasSuccessful`).
 */
export const RATE_LIMIT_ERROR_KEY = 'rateLimit' as const

/** Message affiché quand le quota est épuisé ; `availableIn` en secondes. */
export function rateLimitMessage(availableIn: number): string {
  const minutes = Math.ceil(availableIn / 60)
  if (minutes <= 1) return 'Trop de tentatives. Réessayez dans une minute.'
  return `Trop de tentatives. Réessayez dans ${minutes} minutes.`
}

/** Erreur de rate limiting parmi les erreurs d'un `useForm`, s'il y en a une. */
export function rateLimitError(errors: object): string | undefined {
  const value = (errors as Record<string, unknown>)[RATE_LIMIT_ERROR_KEY]
  return typeof value === 'string' ? value : undefined
}
