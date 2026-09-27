import env from '#start/env'

/**
 * Suivi des erreurs en production (Sentry, issue #27) — voir
 * `#services/error_tracking_service` et docs/DEPLOYMENT.md.
 *
 * Désactivé tant que `SENTRY_DSN` n'est pas défini (dev, test, CI) : les
 * erreurs restent alors seulement dans les logs.
 */
const errorTrackingConfig = {
  dsn: env.get('SENTRY_DSN'),
  environment: env.get('SENTRY_ENVIRONMENT', env.get('NODE_ENV')),
  /** Sha du commit déployé : `RENDER_GIT_COMMIT` est fourni par Render. */
  release: env.get('SENTRY_RELEASE') ?? env.get('RENDER_GIT_COMMIT'),
}

export default errorTrackingConfig
