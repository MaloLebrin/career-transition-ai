import { PG_NOTIFY_MAX_BYTES } from '#shared/constants/runtime_stores'
import env from '#start/env'
import { buildPostgresConnection } from '#utils/database_connection'
import {
  PostgresTransmitTransport,
  postgresTransport,
  type TransportLogger,
} from '#utils/postgres_transmit_transport'
import db from '@adonisjs/lucid/services/db'
import { Bus } from '@boringnode/bus'
import { test } from '@japa/runner'
import type pg from 'pg'

/**
 * Transport Transmit sur Postgres LISTEN/NOTIFY (#172), contre la vraie base
 * de test : deux transports = deux process (worker et web).
 */

const CHANNEL = 'transmit_broadcast_spec'

function connection(extra: Partial<pg.ClientConfig> = {}): pg.ClientConfig {
  return {
    ...buildPostgresConnection({
      DB_URL: env.get('DB_URL'),
      DB_HOST: env.get('DB_HOST'),
      DB_PORT: env.get('DB_PORT'),
      DB_USER: env.get('DB_USER'),
      DB_PASSWORD: env.get('DB_PASSWORD'),
      DB_DATABASE: env.get('DB_DATABASE'),
      DB_SSL: env.get('DB_SSL'),
    }),
    ...extra,
  }
}

function recordingLogger() {
  const entries: Array<{ level: 'warn' | 'error'; message: string }> = []
  const logger: TransportLogger = {
    warn: (_data, message) => entries.push({ level: 'warn', message }),
    error: (_data, message) => entries.push({ level: 'error', message }),
  }
  return { logger, entries }
}

function transport(id: string, extra: Partial<pg.ClientConfig> = {}) {
  const { logger, entries } = recordingLogger()
  const instance = new PostgresTransmitTransport({
    connection: connection(extra),
    reconnectDelayMs: 20,
    maxReconnectDelayMs: 50,
    logger,
  }).setId(id) as PostgresTransmitTransport
  return { instance, entries }
}

async function waitFor(predicate: () => boolean, timeoutMs = 3_000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('délai dépassé')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

test.group('PostgresTransmitTransport', (group) => {
  const opened: PostgresTransmitTransport[] = []
  group.each.teardown(async () => {
    await Promise.all(opened.splice(0).map((t) => t.disconnect()))
  })
  const open = (id: string, extra: Partial<pg.ClientConfig> = {}) => {
    const created = transport(id, extra)
    opened.push(created.instance)
    return created
  }

  test('une publication du worker atteint l’abonné du web', async ({ assert }) => {
    const { instance: worker } = open('worker')
    const { instance: web } = open('web')
    const received: unknown[] = []
    await web.subscribe(CHANNEL, (payload) => {
      received.push(payload)
    })

    await worker.publish(CHANNEL, { channel: 'users/1/pdf-exports', payload: { status: 'done' } })

    await waitFor(() => received.length === 1)
    assert.deepEqual(received, [{ channel: 'users/1/pdf-exports', payload: { status: 'done' } }])
  })

  test('ignore ses propres publications (même busId)', async ({ assert }) => {
    const { instance: web } = open('web')
    const { instance: other } = open('other')
    const own: unknown[] = []
    const others: unknown[] = []
    await web.subscribe(CHANNEL, (payload) => {
      own.push(payload)
    })
    await other.subscribe(CHANNEL, (payload) => {
      others.push(payload)
    })

    await web.publish(CHANNEL, 'ping')

    await waitFor(() => others.length === 1)
    assert.deepEqual(own, [])
  })

  test('publie hors de la transaction applicative (livré sans commit)', async ({ assert }) => {
    const { instance: worker } = open('worker')
    const { instance: web } = open('web')
    const received: unknown[] = []
    await web.subscribe(CHANNEL, (payload) => {
      received.push(payload)
    })

    const trx = await db.transaction()
    try {
      await worker.publish(CHANNEL, 'pendant une transaction')
      await waitFor(() => received.length === 1)
    } finally {
      await trx.rollback()
    }
    assert.deepEqual(received, ['pendant une transaction'])
  })

  test('abandonne sans exception une charge trop grande pour NOTIFY', async ({ assert }) => {
    const { instance: worker, entries } = open('worker')
    const { instance: web } = open('web')
    const received: unknown[] = []
    await web.subscribe(CHANNEL, (payload) => {
      received.push(payload)
    })

    await worker.publish(CHANNEL, 'x'.repeat(PG_NOTIFY_MAX_BYTES))
    await worker.publish(CHANNEL, 'suivant')

    await waitFor(() => received.length === 1)
    assert.deepEqual(received, ['suivant'])
    assert.deepEqual(
      entries.map((e) => e.level),
      ['warn']
    )
  })

  test('se reconnecte, ré-écoute ses canaux et prévient le Bus', async ({ assert }) => {
    const { instance: worker } = open('worker')
    const { instance: web, entries } = open('web', { application_name: 'transmit_spec_web' })
    const received: unknown[] = []
    let reconnections = 0
    web.onReconnect(() => {
      reconnections += 1
    })
    await web.subscribe(CHANNEL, (payload) => {
      received.push(payload)
    })

    await db.rawQuery(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = ?`,
      ['transmit_spec_web']
    )
    await waitFor(() => !web.isConnected())
    await waitFor(() => web.isConnected())

    await worker.publish(CHANNEL, 'après coupure')

    await waitFor(() => received.length === 1)
    assert.deepEqual(received, ['après coupure'])
    assert.equal(reconnections, 1)
    assert.isTrue(entries.some((e) => e.level === 'warn'))
  })

  test('base injoignable : subscribe ne rejette pas, publish rejette (file du Bus)', async ({
    assert,
  }) => {
    const { instance, entries } = open('down', { port: 1, connectionTimeoutMillis: 500 })

    await instance.subscribe(CHANNEL, () => {})
    await assert.rejects(() => instance.publish(CHANNEL, 'perdu ?'))

    assert.isFalse(instance.isConnected())
    assert.isTrue(entries.some((e) => e.level === 'error'))
  })

  test('disconnect ferme la connexion et coupe les reconnexions', async ({ assert }) => {
    const { instance } = open('closing')
    await instance.subscribe(CHANNEL, () => {})
    assert.isTrue(instance.isConnected())

    await instance.disconnect()

    assert.isFalse(instance.isConnected())
    await instance.subscribe(CHANNEL, () => {})
    assert.isFalse(instance.isConnected())
  })

  test('publish exige setId (contrat Transport)', async ({ assert }) => {
    const bare = new PostgresTransmitTransport({ connection: connection() })
    opened.push(bare)
    await assert.rejects(() => bare.publish(CHANNEL, 'x'), /setId/)
  })
})

test.group('PostgresTransmitTransport — avec le Bus de Transmit', (group) => {
  const buses: Bus[] = []
  group.each.teardown(async () => {
    await Promise.all(buses.splice(0).map((bus) => bus.disconnect()))
  })

  test('deux Bus (web, worker) échangent par la fabrique postgresTransport', async ({ assert }) => {
    const factory = postgresTransport({
      connection: connection(),
      logger: recordingLogger().logger,
    })
    const web = new Bus(factory(), { retryQueue: { enabled: true } })
    const worker = new Bus(factory(), { retryQueue: { enabled: true } })
    buses.push(web, worker)
    const received: unknown[] = []
    await web.subscribe(CHANNEL, (message) => {
      received.push(message)
    })

    assert.isTrue(await worker.publish(CHANNEL, { type: 'broadcast', channel: 'c', payload: 1 }))

    await waitFor(() => received.length === 1)
    assert.deepEqual(received, [{ type: 'broadcast', channel: 'c', payload: 1 }])
  })
})
