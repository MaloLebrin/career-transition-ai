/**
 * Construction de la connexion `pg` à partir des variables d'environnement.
 *
 * Deux modes, exclusifs :
 * - `DB_URL` (connection string, ex. Neon `?sslmode=require`, Render) ;
 * - le jeu `DB_HOST` + `DB_PORT` + `DB_USER` + `DB_DATABASE` (+ `DB_PASSWORD`
 *   optionnel), ex. le Postgres du `docker-compose.yml`.
 *
 * `DB_SSL` (défaut `true`) : `false` uniquement pour un Postgres sans TLS
 * (compose local, base de test) — sinon `pg` lève
 * « The server does not support SSL connections ».
 */

export type DatabaseEnv = {
  DB_URL?: string
  DB_HOST?: string
  DB_PORT?: number
  DB_USER?: string
  DB_PASSWORD?: string
  DB_DATABASE?: string
  DB_SSL?: boolean
}

type SslConfig = { rejectUnauthorized: false } | false

/**
 * TCP keepalive : Neon et le NAT de Render ferment les sockets idle
 * (« Connection ended unexpectedly »). Le premier probe part avant le
 * `idleTimeoutMillis` du pool (config/database.ts).
 */
const TCP_KEEPALIVE = {
  keepAlive: true as const,
  keepAliveInitialDelayMillis: 10_000,
}

export type PostgresConnection = (
  | { connectionString: string; ssl: SslConfig }
  | {
      host: string
      port: number
      user: string
      password?: string
      database: string
      ssl: SslConfig
    }
) &
  typeof TCP_KEEPALIVE

const REQUIRED_DISCRETE_KEYS = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_DATABASE'] as const

export function buildPostgresConnection(values: DatabaseEnv): PostgresConnection {
  const ssl: SslConfig = (values.DB_SSL ?? true) ? { rejectUnauthorized: false } : false

  if (values.DB_URL) {
    return { connectionString: values.DB_URL, ssl, ...TCP_KEEPALIVE }
  }

  const missing = REQUIRED_DISCRETE_KEYS.filter((key) => {
    const value = values[key]
    return value === undefined || value === ''
  })
  if (missing.length > 0) {
    throw new Error(
      `Configuration base de données incomplète : définir DB_URL, ou le jeu complet ` +
        `${REQUIRED_DISCRETE_KEYS.join(', ')} (manquant : ${missing.join(', ')}).`
    )
  }

  return {
    host: values.DB_HOST!,
    port: values.DB_PORT!,
    user: values.DB_USER!,
    password: values.DB_PASSWORD,
    database: values.DB_DATABASE!,
    ssl,
    ...TCP_KEEPALIVE,
  }
}
