export type PostgresConnectionFields = {
  host: string
  port: number
  user: string
  password: string | undefined
  database: string
}

export type ResolvePostgresInput = {
  nodeEnv: 'development' | 'production' | 'test'
  dbHost?: string
  dbPort?: number
  dbUser?: string
  dbPassword?: string
  dbDatabase?: string
  addonHost?: string
  addonPort?: number
  addonUser?: string
  addonPassword?: string
  addonDb?: string
}

function isNonEmptyString(value: string | undefined): value is string {
  return value !== undefined && value !== ''
}

/**
 * Resolves PostgreSQL connection fields from either the full DB_* set (local) or
 * the full POSTGRESQL_ADDON_* set (Clever Cloud). Avoids mixing the two sources.
 * In test mode, placeholders apply when neither source is complete (postgres is unused).
 */
export function resolvePostgresConnection(input: ResolvePostgresInput): PostgresConnectionFields {
  if (input.nodeEnv === 'test') {
    const useDb =
      isNonEmptyString(input.dbHost) &&
      input.dbPort !== undefined &&
      isNonEmptyString(input.dbUser) &&
      isNonEmptyString(input.dbDatabase)
    const useAddon =
      isNonEmptyString(input.addonHost) &&
      input.addonPort !== undefined &&
      isNonEmptyString(input.addonUser) &&
      isNonEmptyString(input.addonDb)

    if (useDb) {
      return {
        host: input.dbHost!,
        port: input.dbPort!,
        user: input.dbUser!,
        password: input.dbPassword,
        database: input.dbDatabase!,
      }
    }
    if (useAddon) {
      return {
        host: input.addonHost!,
        port: input.addonPort!,
        user: input.addonUser!,
        password: input.addonPassword,
        database: input.addonDb!,
      }
    }
    return {
      host: '127.0.0.1',
      port: 5432,
      user: 'root',
      password: 'root',
      database: 'app_test_unused',
    }
  }

  const useDb =
    isNonEmptyString(input.dbHost) &&
    input.dbPort !== undefined &&
    isNonEmptyString(input.dbUser) &&
    isNonEmptyString(input.dbDatabase)

  const useAddon =
    isNonEmptyString(input.addonHost) &&
    input.addonPort !== undefined &&
    isNonEmptyString(input.addonUser) &&
    isNonEmptyString(input.addonDb)

  if (useDb) {
    return {
      host: input.dbHost!,
      port: input.dbPort!,
      user: input.dbUser!,
      password: input.dbPassword,
      database: input.dbDatabase!,
    }
  }

  if (useAddon) {
    return {
      host: input.addonHost!,
      port: input.addonPort!,
      user: input.addonUser!,
      password: input.addonPassword,
      database: input.addonDb!,
    }
  }

  throw new Error(
    'PostgreSQL configuration is incomplete. Set DB_HOST, DB_PORT, DB_USER, and DB_DATABASE (optional DB_PASSWORD), or the full POSTGRESQL_ADDON_* set from the Clever Cloud PostgreSQL add-on. Do not mix partial DB_* with partial POSTGRESQL_ADDON_*.'
  )
}
