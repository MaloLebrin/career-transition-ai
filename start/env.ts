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
  | `DB_URL` ou le jeu `DB_HOST/DB_PORT/DB_USER/DB_DATABASE` : la
  | complétude est vérifiée dans config/database.ts. `DB_SSL` vaut
  | `true` par défaut ; `false` pour un Postgres sans TLS.
  */
  DB_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),
  DB_SSL: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring @adonisjs/queue
  |----------------------------------------------------------
  */
  QUEUE_DRIVER: Env.schema.enum(['redis', 'database', 'sync'] as const),

  /*
  |----------------------------------------------------------
  | Inscription publique (/auth/register) — voir config/registration.ts
  |----------------------------------------------------------
  | Défaut : `false` en production (beta fermée), `true` ailleurs.
  */
  REGISTRATION_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Référencement — voir config/seo.ts
  |----------------------------------------------------------
  | `SEO_INDEXING` : `false` par défaut (noindex), `true` sur le
  | domaine final uniquement.
  */
  SEO_INDEXING: Env.schema.boolean.optional(),
  GOOGLE_SITE_VERIFICATION: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | IA serveur (jobs d’analyse — Mistral ou none)
  |----------------------------------------------------------
  */
  AI_PROVIDER: Env.schema.enum.optional(['mistral', 'none'] as const),
  MISTRAL_API_KEY: Env.schema.string.optional(),
  MISTRAL_MODEL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Suivi des erreurs — voir config/error_tracking.ts
  |----------------------------------------------------------
  | Sans `SENTRY_DSN`, rien n'est envoyé. `RENDER_GIT_COMMIT` est
  | injecté par Render et sert de release par défaut.
  */
  SENTRY_DSN: Env.schema.string.optional(),
  SENTRY_ENVIRONMENT: Env.schema.string.optional(),
  SENTRY_RELEASE: Env.schema.string.optional(),
  RENDER_GIT_COMMIT: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Stockage des fichiers (exports PDF) — voir config/drive.ts
  |----------------------------------------------------------
  | `fs` (défaut) : disque local `storage/`. `s3` : bucket S3
  | compatible (Cloudflare R2) quand web et worker ne partagent
  | pas de disque ; `S3_*` alors requises (vérifié par config/drive.ts).
  */
  DRIVE_DISK: Env.schema.enum.optional(['fs', 's3'] as const),
  S3_BUCKET: Env.schema.string.optional(),
  S3_ACCESS_KEY_ID: Env.schema.string.optional(),
  S3_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  S3_ENDPOINT: Env.schema.string.optional(),
  S3_REGION: Env.schema.string.optional(),
})
