import { toPublicHealthReport } from '#utils/health_report'
import type { HealthCheckReport } from '@adonisjs/core/types/health'
import { test } from '@japa/runner'

const SECRET = 'connect ECONNREFUSED ep-secret.neon.tech:5432 user=cta password=hunter2'

function failedReport(): HealthCheckReport {
  return {
    isHealthy: false,
    status: 'error',
    finishedAt: new Date('2026-09-27T00:00:00Z'),
    debugInfo: { pid: 42, uptime: 10, version: 'v24.0.0', platform: 'linux' },
    checks: [
      {
        name: 'Database health check (postgres)',
        isCached: false,
        status: 'error',
        message: SECRET,
        finishedAt: new Date('2026-09-27T00:00:00Z'),
        meta: { error: new Error(SECRET), connection: { name: 'postgres', dialect: 'postgres' } },
      },
    ],
  }
}

test.group('toPublicHealthReport', () => {
  test('garde le statut global et celui de chaque check', ({ assert }) => {
    assert.deepEqual(toPublicHealthReport(failedReport()), {
      isHealthy: false,
      status: 'error',
      finishedAt: new Date('2026-09-27T00:00:00Z'),
      checks: [{ name: 'Database health check (postgres)', status: 'error' }],
    })
  })

  test("n'expose ni debugInfo ni le message d'erreur de la base", ({ assert }) => {
    const json = JSON.stringify(toPublicHealthReport(failedReport()))
    assert.notInclude(json, 'ep-secret')
    assert.notInclude(json, 'hunter2')
    assert.notInclude(json, 'debugInfo')
    assert.notInclude(json, 'pid')
  })
})
