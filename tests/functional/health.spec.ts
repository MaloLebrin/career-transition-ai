import env from '#start/env'
import { test } from '@japa/runner'

function baseUrl(): string {
  return `http://${env.get('HOST')}:${env.get('PORT')}`
}

test.group('GET /health (functional)', () => {
  test('200 + isHealthy quand la base répond, sans session', async ({ assert }) => {
    const res = await fetch(`${baseUrl()}/health`, {
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    })

    assert.equal(res.status, 200)
    const body = (await res.json()) as Record<string, unknown>
    assert.containSubset(body, {
      isHealthy: true,
      status: 'ok',
      checks: [{ name: 'Database health check (postgres)', status: 'ok' }],
    })
    assert.notProperty(body, 'debugInfo')
  })
})
