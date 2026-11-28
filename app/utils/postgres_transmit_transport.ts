/**
 * Transport Transmit sur Postgres `LISTEN/NOTIFY` (#172).
 *
 * Web et worker sont deux process (deploy/compose.yml) : un
 * `transmit.broadcast()` émis par un job n'atteint les navigateurs, connectés
 * au web, que si un bus relaie le message. Postgres est déjà là : chaque
 * process ouvre **une** connexion dédiée (hors pool Lucid, hors transaction)
 * qui écoute le canal et publie par `pg_notify`. Aucun service à exploiter en
 * plus de la base.
 *
 * Contrat `Transport` de `@boringnode/bus` : le `Bus` de Transmit ignore nos
 * propres messages via `busId`, met en file d'attente une publication en
 * échec et la rejoue à `onReconnect`.
 *
 * Robustesse :
 * - `subscribe` ne rejette jamais (Transmit l'appelle en `void` dans son
 *   constructeur) : un échec de connexion est journalisé et retenté avec un
 *   délai croissant, les canaux sont ré-écoutés à la reconnexion ;
 * - charge > `PG_NOTIFY_MAX_BYTES` : relais abandonné (journalisé), la
 *   diffusion locale a déjà eu lieu et la page se met à jour au rechargement ;
 * - `NOTIFY` est livré au commit : la connexion dédiée n'est jamais dans une
 *   transaction applicative.
 */

import { PG_NOTIFY_MAX_BYTES } from '#shared/constants/runtime_stores'
import type {
  Serializable,
  SubscribeHandler,
  Transport,
  TransportFactory,
} from '@boringnode/bus/types/main'
import pg from 'pg'

export type TransportLogger = {
  warn: (data: Record<string, unknown>, message: string) => void
  error: (data: Record<string, unknown>, message: string) => void
}

export type PostgresTransportOptions = {
  /** Connexion `pg` (même base que Lucid, `buildPostgresConnection`). */
  connection: pg.ClientConfig
  /** Premier délai de reconnexion (doublé à chaque échec, plafonné à `maxReconnectDelayMs`). */
  reconnectDelayMs?: number
  maxReconnectDelayMs?: number
  logger?: TransportLogger
}

type Envelope = { busId: string; payload: Serializable }

/**
 * Logger Adonis chargé à l'appel : ce module est importé par
 * `config/transmit.ts`, avant que le service logger existe.
 */
const lazyLogger: TransportLogger = {
  warn: (data, message) => {
    void import('@adonisjs/core/services/logger').then(({ default: logger }) =>
      logger.warn(data, message)
    )
  },
  error: (data, message) => {
    void import('@adonisjs/core/services/logger').then(({ default: logger }) =>
      logger.error(data, message)
    )
  },
}

export class PostgresTransmitTransport implements Transport {
  #id: string | undefined
  #client: pg.Client | null = null
  #connecting: Promise<pg.Client | null> | null = null
  #handlers = new Map<string, SubscribeHandler<any>>()
  #reconnectCallbacks: Array<() => void> = []
  #reconnectTimer: NodeJS.Timeout | null = null
  #failures = 0
  #hasConnectedOnce = false
  #closed = false
  readonly #options: Required<Omit<PostgresTransportOptions, 'connection'>> & {
    connection: pg.ClientConfig
  }

  constructor(options: PostgresTransportOptions) {
    this.#options = {
      reconnectDelayMs: 1_000,
      maxReconnectDelayMs: 30_000,
      logger: lazyLogger,
      ...options,
    }
  }

  setId(id: string) {
    this.#id = id
    return this
  }

  onReconnect(callback: () => void) {
    this.#reconnectCallbacks.push(callback)
  }

  /** Vrai quand la connexion d'écoute est ouverte (diagnostic, tests). */
  isConnected() {
    return this.#client !== null
  }

  async publish(channel: string, message: Serializable) {
    if (!this.#id) throw new Error('PostgresTransmitTransport: setId() doit précéder publish()')
    const encoded = JSON.stringify({ busId: this.#id, payload: message } satisfies Envelope)
    const bytes = Buffer.byteLength(encoded)
    if (bytes > PG_NOTIFY_MAX_BYTES) {
      // Pas d'exception : le Bus la mettrait en file et la rejouerait sans fin.
      this.#options.logger.warn(
        { channel, bytes, max: PG_NOTIFY_MAX_BYTES },
        'Transmit (postgres) : charge trop grande pour NOTIFY, relais abandonné'
      )
      return
    }
    const client = await this.#ensureConnected()
    // Rejet → le Bus met le message en file et le rejoue à la reconnexion.
    if (!client) throw new Error('PostgresTransmitTransport: connexion indisponible')
    await client.query('SELECT pg_notify($1, $2)', [channel, encoded])
  }

  async subscribe<T extends Serializable>(channel: string, handler: SubscribeHandler<T>) {
    this.#handlers.set(channel, handler)
    const client = await this.#ensureConnected()
    if (!client) return
    await this.#listen(client, channel).catch((error) => this.#onConnectionLost(client, error))
  }

  async unsubscribe(channel: string) {
    this.#handlers.delete(channel)
    const client = this.#client
    if (!client) return
    await client.query(`UNLISTEN ${client.escapeIdentifier(channel)}`).catch(() => undefined)
  }

  async disconnect() {
    this.#closed = true
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer)
    this.#reconnectTimer = null
    await this.#connecting?.catch(() => null)
    const client = this.#client
    this.#client = null
    this.#handlers.clear()
    if (client) await client.end().catch(() => undefined)
  }

  #listen(client: pg.Client, channel: string) {
    return client.query(`LISTEN ${client.escapeIdentifier(channel)}`)
  }

  #ensureConnected(): Promise<pg.Client | null> {
    if (this.#client) return Promise.resolve(this.#client)
    if (this.#closed) return Promise.resolve(null)
    this.#connecting ??= this.#connect().finally(() => {
      this.#connecting = null
    })
    return this.#connecting
  }

  async #connect(): Promise<pg.Client | null> {
    const client = new pg.Client(this.#options.connection)
    client.on('notification', (notification) => this.#dispatch(notification))
    client.on('error', (error) => this.#onConnectionLost(client, error))
    client.on('end', () => this.#onConnectionLost(client))
    try {
      await client.connect()
      // Séquentiel : une seule connexion, requêtes en file côté `pg`.
      for (const channel of this.#handlers.keys()) {
        await this.#listen(client, channel)
      }
    } catch (error) {
      client.removeAllListeners('end')
      await client.end().catch(() => undefined)
      this.#options.logger.error(
        { error: (error as Error).message, attempt: this.#failures + 1 },
        'Transmit (postgres) : connexion impossible, nouvel essai planifié'
      )
      this.#scheduleReconnect()
      return null
    }

    if (this.#closed) {
      await client.end().catch(() => undefined)
      return null
    }
    this.#client = client
    this.#failures = 0
    if (this.#hasConnectedOnce) {
      // Rejoue les publications en échec (file d'attente du Bus).
      this.#reconnectCallbacks.forEach((callback) => callback())
    }
    this.#hasConnectedOnce = true
    return client
  }

  #dispatch(notification: pg.Notification) {
    const handler = this.#handlers.get(notification.channel)
    if (!handler || !notification.payload) return
    let envelope: Envelope
    try {
      envelope = JSON.parse(notification.payload) as Envelope
    } catch {
      this.#options.logger.warn(
        { channel: notification.channel },
        'Transmit (postgres) : message illisible ignoré'
      )
      return
    }
    if (envelope.busId === this.#id) return
    void Promise.resolve(handler(envelope.payload)).catch((error) =>
      this.#options.logger.error(
        { error: (error as Error).message },
        'Transmit (postgres) : échec du traitement'
      )
    )
  }

  #onConnectionLost(client: pg.Client, error?: Error) {
    if (this.#client !== client) return
    this.#client = null
    client.removeAllListeners('end')
    void client.end().catch(() => undefined)
    if (this.#closed) return
    this.#options.logger.warn(
      { error: error?.message },
      'Transmit (postgres) : connexion perdue, reconnexion'
    )
    this.#scheduleReconnect()
  }

  #scheduleReconnect() {
    if (this.#closed || this.#reconnectTimer) return
    const delay = Math.min(
      this.#options.reconnectDelayMs * 2 ** this.#failures,
      this.#options.maxReconnectDelayMs
    )
    this.#failures += 1
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null
      void this.#ensureConnected()
    }, delay)
    // Ne retient pas une commande ace qui a fini son travail.
    this.#reconnectTimer.unref()
  }
}

export function postgresTransport(options: PostgresTransportOptions): TransportFactory {
  return () => new PostgresTransmitTransport(options)
}
