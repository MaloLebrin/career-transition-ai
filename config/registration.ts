import env from '#start/env'
import app from '@adonisjs/core/services/app'

/**
 * Inscriptions publiques, toutes deux **fermées par défaut en production**
 * (beta fermée) et ouvertes ailleurs :
 *
 * - `enabled` (`REGISTRATION_ENABLED`) : un conseiller crée son compte **et
 *   son organisation** sur `/auth/register`. Fermée, les comptes se créent
 *   depuis l'UI super admin, puis par l'onboarding sur invitation.
 * - `candidateEnabled` (`B2C_REGISTRATION_ENABLED`, #93) : un particulier
 *   crée son compte candidat dans l'organisation plateforme sur
 *   `/inscription`.
 *
 * Lues à chaque requête (middleware `registrationOpen`, props partagées
 * `registrationEnabled` / `b2cRegistrationEnabled`) : les tests les basculent
 * avec `config.set()`.
 */
const registrationConfig = {
  enabled: env.get('REGISTRATION_ENABLED', !app.inProduction),
  candidateEnabled: env.get('B2C_REGISTRATION_ENABLED', !app.inProduction),
}

export default registrationConfig
