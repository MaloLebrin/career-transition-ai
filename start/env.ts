/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  | Use DB_* locally. On Clever Cloud, the PostgreSQL add-on injects
  | POSTGRESQL_ADDON_*; either set is enough (see resolvePostgresConnection).
  */
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),
  POSTGRESQL_ADDON_HOST: Env.schema.string.optional({ format: 'host' }),
  POSTGRESQL_ADDON_PORT: Env.schema.number.optional(),
  POSTGRESQL_ADDON_USER: Env.schema.string.optional(),
  POSTGRESQL_ADDON_PASSWORD: Env.schema.string.optional(),
  POSTGRESQL_ADDON_DB: Env.schema.string.optional(),
  SQLITE_DB_PATH: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring @adonisjs/queue
  |----------------------------------------------------------
  */
  QUEUE_DRIVER: Env.schema.enum(['redis', 'database', 'sync'] as const),

  /*
  |----------------------------------------------------------
  | IA serveur (jobs d’analyse — Mistral, Gemini, OpenAI ou none)
  |----------------------------------------------------------
  */
  AI_PROVIDER: Env.schema.enum.optional(['mistral', 'gemini', 'openai', 'none'] as const),
  MISTRAL_API_KEY: Env.schema.string.optional(),
  MISTRAL_MODEL: Env.schema.string.optional(),
  GEMINI_API_KEY: Env.schema.string.optional(),
  OPENAI_API_KEY: Env.schema.string.optional(),
  OPENAI_MODEL: Env.schema.string.optional(),
})
