import type { HealthCheckReport } from '@adonisjs/core/types/health'

/**
 * Vue publique d'un rapport de santé : `/health` est accessible sans
 * authentification, on n'expose donc ni `debugInfo` (pid, version de Node),
 * ni les `message`/`meta` des checks (une erreur `pg` peut contenir l'hôte,
 * l'utilisateur ou la base).
 */
export type PublicHealthReport = Pick<HealthCheckReport, 'isHealthy' | 'status' | 'finishedAt'> & {
  checks: Pick<HealthCheckReport['checks'][number], 'name' | 'status'>[]
}

export function toPublicHealthReport(report: HealthCheckReport): PublicHealthReport {
  return {
    isHealthy: report.isHealthy,
    status: report.status,
    finishedAt: report.finishedAt,
    checks: report.checks.map(({ name, status }) => ({ name, status })),
  }
}
