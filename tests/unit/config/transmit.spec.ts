import transmitConfig, { transmitTransport } from '#config/transmit'
import { TRANSMIT_PG_CHANNEL, TRANSMIT_TRANSPORTS } from '#shared/constants/runtime_stores'
import { envSchema } from '#start/env_schema'
import { PostgresTransmitTransport } from '#utils/postgres_transmit_transport'
import { configProvider } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { MemoryTransport } from '@boringnode/bus/transports/memory'
import { test } from '@japa/runner'

/** Transport des diffusions Transmit entre web et worker (#172). */
test.group('config/transmit — transport', () => {
  test('postgres : relais LISTEN/NOTIFY sur un canal SQL simple', ({ assert }) => {
    const transport = transmitTransport(TRANSMIT_TRANSPORTS.POSTGRES)
    assert.isNotNull(transport)
    assert.equal(transport!.channel, TRANSMIT_PG_CHANNEL)
    assert.match(TRANSMIT_PG_CHANNEL, /^[a-z_]+$/)
    // La fabrique ne se connecte pas : la connexion s'ouvre au premier subscribe.
    assert.instanceOf(transport!.driver(), PostgresTransmitTransport)
  })

  test('memory : bus du process (tests)', ({ assert }) => {
    const transport = transmitTransport(TRANSMIT_TRANSPORTS.MEMORY)
    assert.instanceOf(transport!.driver(), MemoryTransport)
  })

  test('none : aucun transport, diffusion locale seulement', ({ assert }) => {
    assert.isNull(transmitTransport(TRANSMIT_TRANSPORTS.NONE))
  })

  test('jamais `transport: null` par défaut (env de test : memory)', async ({ assert }) => {
    const config = await configProvider.resolve<any>(app, transmitConfig)
    const resolved = config ?? transmitConfig
    assert.isNotNull(resolved.transport)
    assert.equal(resolved.pingInterval, '30s')
  })

  test('TRANSMIT_TRANSPORT n’accepte que les transports configurés', ({ assert }) => {
    const rule = envSchema.TRANSMIT_TRANSPORT as (key: string, value?: string) => unknown
    for (const name of Object.values(TRANSMIT_TRANSPORTS)) {
      assert.equal(rule('TRANSMIT_TRANSPORT', name), name)
    }
    assert.isUndefined(rule('TRANSMIT_TRANSPORT', undefined))
    assert.throws(() => rule('TRANSMIT_TRANSPORT', 'redis'))
  })
})
