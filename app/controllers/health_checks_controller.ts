import { toPublicHealthReport } from '#utils/health_report'
import { healthChecks } from '#start/health'
import type { HealthChecks } from '@adonisjs/core/health'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class HealthChecksController {
  constructor(private checks: Pick<HealthChecks, 'run'> = healthChecks) {}

  public async handle({ response }: HttpContext) {
    const report = await this.checks.run()
    const body = toPublicHealthReport(report)

    if (report.isHealthy) {
      return response.ok(body)
    }

    // Détail complet (message d'erreur, meta) dans les logs uniquement.
    logger.error({ report }, 'health check failed')
    return response.serviceUnavailable(body)
  }
}
