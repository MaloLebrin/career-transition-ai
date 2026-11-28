import limiterConfig from '#config/limiter'
import { LIMITER_STORES, RATE_LIMITS_TABLE } from '#shared/constants/runtime_stores'
import { envSchema } from '#start/env_schema'
import { configProvider } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { LimiterManager } from '@adonisjs/limiter'
import limiter from '@adonisjs/limiter/services/main'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

/**
 * Store du rate limiting (#172) : compteurs dans Postgres (`rate_limits`),
 * partagés par toutes les instances web et conservés au redémarrage.
 */

async function resolvedConfig() {
  const config = await configProvider.resolve<any>(app, limiterConfig)
  if (!config) throw new Error('config/limiter.ts non résolue')
  return config
}

async function rows() {
  return db.from(RATE_LIMITS_TABLE).select('key', 'points')
}

test.group('config/limiter — store', (group) => {
  group.each.setup(() => () => limiter.clear())

  test('store `database` par défaut, `memory` conservé', async ({ assert }) => {
    const config = await resolvedConfig()
    assert.equal(config.default, LIMITER_STORES.DATABASE)
    assert.sameMembers(Object.keys(config.stores), Object.values(LIMITER_STORES))
  })

  test('LIMITER_STORE n’accepte que les stores configurés', ({ assert }) => {
    const rule = envSchema.LIMITER_STORE as (key: string, value?: string) => unknown
    assert.equal(rule('LIMITER_STORE', 'database'), 'database')
    assert.equal(rule('LIMITER_STORE', 'memory'), 'memory')
    assert.isUndefined(rule('LIMITER_STORE', undefined))
    assert.throws(() => rule('LIMITER_STORE', 'redis'))
  })

  test('les compteurs sont écrits dans rate_limits', async ({ assert }) => {
    const store = limiter.use({ requests: 2, duration: '1 minute' })
    assert.equal(store.name, LIMITER_STORES.DATABASE)

    await store.consume('spec_ip')

    const [row] = await rows()
    assert.include(row.key, 'spec_ip')
    assert.equal(Number(row.points), 1)
  })

  test('deux instances web partagent le même compteur', async ({ assert }) => {
    const config = await resolvedConfig()
    const instanceA = new LimiterManager(config)
    const instanceB = new LimiterManager(config)
    const options = { requests: 2, duration: '1 minute' } as const

    await instanceA.use(options).consume('shared_ip')
    await instanceB.use(options).consume('shared_ip')

    await assert.rejects(() => instanceA.use(options).consume('shared_ip'))
    const remaining = await instanceB.use(options).remaining('shared_ip')
    assert.equal(remaining, 0)
  })

  test('limiter.clear() vide la table (remise à zéro des tests functional)', async ({ assert }) => {
    await limiter.use({ requests: 5, duration: '1 minute' }).consume('to_clear')
    assert.lengthOf(await rows(), 1)

    await limiter.clear()

    assert.lengthOf(await rows(), 0)
  })
})
