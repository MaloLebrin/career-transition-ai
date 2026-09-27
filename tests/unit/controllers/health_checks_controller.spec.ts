import HealthChecksController from '#controllers/health_checks_controller'
import { BaseCheck, HealthChecks, Result } from '@adonisjs/core/health'
import type { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'

class StaticCheck extends BaseCheck {
  constructor(
    public name: string,
    private result: Result
  ) {
    super()
  }

  async run() {
    return this.result
  }
}

function makeCtx() {
  const response = {
    statusCode: 0,
    body: null as unknown,
    ok(body: unknown) {
      this.statusCode = 200
      this.body = body
    },
    serviceUnavailable(body: unknown) {
      this.statusCode = 503
      this.body = body
    },
  }
  return { ctx: { response } as unknown as HttpContext, response }
}

test.group('HealthChecksController.handle', () => {
  test('200 quand tous les checks passent', async ({ assert }) => {
    const checks = new HealthChecks().register([new StaticCheck('db', Result.ok('connected'))])
    const { ctx, response } = makeCtx()

    await new HealthChecksController(checks).handle(ctx)

    assert.equal(response.statusCode, 200)
    assert.containSubset(response.body, { isHealthy: true, checks: [{ name: 'db', status: 'ok' }] })
  })

  test("503 sans fuite du message d'erreur quand la base est injoignable", async ({ assert }) => {
    const checks = new HealthChecks().register([
      new StaticCheck('db', Result.failed('getaddrinfo ENOTFOUND ep-secret.neon.tech')),
    ])
    const { ctx, response } = makeCtx()

    await new HealthChecksController(checks).handle(ctx)

    assert.equal(response.statusCode, 503)
    assert.containSubset(response.body, {
      isHealthy: false,
      checks: [{ name: 'db', status: 'error' }],
    })
    assert.notInclude(JSON.stringify(response.body), 'ep-secret')
  })
})
