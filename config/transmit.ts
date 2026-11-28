import env from '#start/env'
import {
  TRANSMIT_PG_CHANNEL,
  TRANSMIT_TRANSPORTS,
  type TransmitTransportName,
} from '#shared/constants/runtime_stores'
import { buildPostgresConnection } from '#utils/database_connection'
import { postgresTransport } from '#utils/postgres_transmit_transport'
import { defineConfig } from '@adonisjs/transmit'
import { memory } from '@boringnode/bus/transports/memory'
import type { TransportFactory } from '@boringnode/bus/types/main'

/**
 * Bus partagé entre les process (#172) : web et worker sont séparés
 * (deploy/compose.yml) et les jobs diffusent (`broadcastPdfExportUpdatedToUsers`,
 * `NotificationService.notify`). Sans bus, une diffusion n'atteint que les
 * clients SSE connectés au process émetteur — jamais le navigateur pour un job.
 *
 * - `postgres` (défaut) : `LISTEN/NOTIFY` sur la base de l'application, une
 *   connexion dédiée par process, aucun service en plus (`docs/DEPLOYMENT.md`) ;
 * - `memory` : bus du process, réservé aux tests (`.env.test`) ;
 * - `none` : diffusion locale seulement (tout en un process, `QUEUE_DRIVER=sync`).
 */
export function transmitTransport(
  name: TransmitTransportName
): { driver: TransportFactory; channel: string } | null {
  if (name === TRANSMIT_TRANSPORTS.NONE) return null
  if (name === TRANSMIT_TRANSPORTS.MEMORY) {
    return { driver: memory(), channel: TRANSMIT_PG_CHANNEL }
  }
  return {
    driver: postgresTransport({
      connection: buildPostgresConnection({
        DB_URL: env.get('DB_URL'),
        DB_HOST: env.get('DB_HOST'),
        DB_PORT: env.get('DB_PORT'),
        DB_USER: env.get('DB_USER'),
        DB_PASSWORD: env.get('DB_PASSWORD'),
        DB_DATABASE: env.get('DB_DATABASE'),
        DB_SSL: env.get('DB_SSL'),
      }),
    }),
    channel: TRANSMIT_PG_CHANNEL,
  }
}

export default defineConfig({
  /**
   * Keep-alive des connexions SSE (`/__transmit/events`) : sans ping, les
   * reverse proxys coupent les connexions inactives au bout de ~60–100 s et
   * le navigateur se reconnecte en boucle.
   */
  pingInterval: '30s',

  transport: transmitTransport(env.get('TRANSMIT_TRANSPORT', TRANSMIT_TRANSPORTS.POSTGRES)),
})
