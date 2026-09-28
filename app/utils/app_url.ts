import env from '#start/env'

/**
 * URL absolue de l'application, construite depuis `APP_URL` (#64).
 *
 * Les liens envoyés par e-mail (onboarding, invitations) ne sont jamais
 * dérivés de la requête : avec `trustProxy`, `Host` / `X-Forwarded-Host`
 * sont fournis par le client et permettraient d'envoyer à un vrai
 * utilisateur un lien vers un domaine piégé.
 */
export function appUrl(path: string = ''): string {
  const base = env.get('APP_URL').replace(/\/+$/, '')
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
