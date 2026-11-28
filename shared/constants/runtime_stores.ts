/**
 * État partagé entre les process web et worker (#172) : transport des
 * diffusions Transmit (`config/transmit.ts`) et store du rate limiting
 * (`config/limiter.ts`). Valeurs lues par `start/env_schema.ts`.
 */

/**
 * `postgres` : relais `LISTEN/NOTIFY` (`#utils/postgres_transmit_transport`),
 * une diffusion du worker atteint les navigateurs connectés au web — défaut.
 * `memory` : bus en mémoire du process, réservé aux tests (simule plusieurs
 * process dans un seul). `none` : diffusion au seul process émetteur.
 */
export const TRANSMIT_TRANSPORTS = {
  POSTGRES: 'postgres',
  MEMORY: 'memory',
  NONE: 'none',
} as const

export type TransmitTransportName = (typeof TRANSMIT_TRANSPORTS)[keyof typeof TRANSMIT_TRANSPORTS]

/**
 * `database` : table `rate_limits` (Postgres), compteurs partagés entre
 * instances et conservés au redémarrage — défaut. `memory` : compteurs du
 * process, perdus au redémarrage.
 */
export const LIMITER_STORES = {
  DATABASE: 'database',
  MEMORY: 'memory',
} as const

export type LimiterStoreName = (typeof LIMITER_STORES)[keyof typeof LIMITER_STORES]

/** Table du store `database` du limiter (migration `create_rate_limits_table`). */
export const RATE_LIMITS_TABLE = 'rate_limits'

/**
 * Canal Postgres des diffusions Transmit (`transport.channel`) : identifiant
 * SQL simple, sans les `::` du canal par défaut de Transmit.
 */
export const TRANSMIT_PG_CHANNEL = 'transmit_broadcast'

/**
 * Taille maximale d'une charge `NOTIFY` (8 000 octets par défaut côté
 * Postgres, marge pour l'enveloppe) : au-delà, le relais est abandonné et la
 * page se met à jour au rechargement.
 */
export const PG_NOTIFY_MAX_BYTES = 7_900
