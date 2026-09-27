import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/** Message de l'erreur envoyée : à rechercher dans Sentry. */
export const ERROR_TRACKING_TEST_MESSAGE = 'Test du suivi des erreurs (error-tracking:test)'

/**
 * Vérifie le branchement du suivi des erreurs après un déploiement : envoie
 * une erreur volontaire à Sentry. Procédure : docs/DEPLOYMENT.md.
 */
export default class ErrorTrackingTest extends BaseCommand {
  static commandName = 'error-tracking:test'
  static description = 'Envoie une erreur de test au suivi des erreurs (Sentry)'

  static options: CommandOptions = { startApp: true }

  async run() {
    const { flushErrorTracking, isErrorTrackingEnabled, reportError } =
      await import('#services/error_tracking_service')

    if (!isErrorTrackingEnabled()) {
      this.logger.error('Suivi des erreurs désactivé : SENTRY_DSN non défini')
      this.exitCode = 1
      return
    }

    reportError(new Error(ERROR_TRACKING_TEST_MESSAGE), {
      tags: { source: ErrorTrackingTest.commandName },
    })
    await flushErrorTracking()
    this.logger.success(`Erreur de test envoyée : « ${ERROR_TRACKING_TEST_MESSAGE} »`)
  }
}
