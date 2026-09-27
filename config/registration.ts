import env from '#start/env'
import app from '@adonisjs/core/services/app'

/**
 * Inscription publique d'un conseiller (`/auth/register`), qui crée un compte
 * **et son organisation** sans invitation.
 *
 * Fermée par défaut en production (beta fermée) : les comptes se créent alors
 * depuis l'UI super admin, puis par l'onboarding sur invitation. Ouverte par
 * défaut en développement et en test. `REGISTRATION_ENABLED` force l'un ou
 * l'autre.
 *
 * Lue à chaque requête (middleware `registrationOpen`, prop partagée
 * `registrationEnabled`) : les tests la basculent avec `config.set()`.
 */
const registrationConfig = {
  enabled: env.get('REGISTRATION_ENABLED', !app.inProduction),
}

export default registrationConfig
