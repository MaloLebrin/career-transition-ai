/*
|--------------------------------------------------------------------------
| Schéma des variables d'environnement
|--------------------------------------------------------------------------
|
| Source unique des variables lues par l'application : tout le code
| serveur passe par `env.get` (`#start/env`), jamais en direct.
| Séparé de start/env.ts pour que les tests valident `.env.example` et
| `.env.production.example` sans démarrer l'application.
|
*/

import { Env } from '@adonisjs/core/env'

export const envSchema = {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  /**
   * URL publique de l'application (`https://app.example.fr`) : base des liens
   * envoyés par e-mail (`#utils/app_url`), jamais dérivée de l'en-tête `Host`.
   */
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  LOG_LEVEL: Env.schema.string(),
  APP_NAME: Env.schema.string.optional(),

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
  | Seuls les adapters déclarés dans config/queue.ts : pas de `redis`.
  */
  QUEUE_DRIVER: Env.schema.enum(['database', 'sync'] as const),

  /*
  |----------------------------------------------------------
  | Inscription publique (/auth/register) — voir config/registration.ts
  |----------------------------------------------------------
  | Défaut : `false` en production (beta fermée), `true` ailleurs.
  */
  REGISTRATION_ENABLED: Env.schema.boolean.optional(),
  /** Inscription des particuliers (`/inscription`, épic B2C #93) : même défaut. */
  B2C_REGISTRATION_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Forfait particuliers (épic B2C) — voir config/billing.ts
  |----------------------------------------------------------
  | `STRIPE_ENABLED` : `false` par défaut, aucun paiement possible.
  | `B2C_RESULTS_PRICE_CENTS` : prix TTC en centimes (défaut 4900).
  */
  STRIPE_ENABLED: Env.schema.boolean.optional(),
  B2C_RESULTS_PRICE_CENTS: Env.schema.number.optional(),
  /** Clés Stripe (#102) : exigées en production dès que `STRIPE_ENABLED=true` (config/stripe.ts). */
  STRIPE_SECRET_KEY: Env.schema.string.optional(),
  STRIPE_WEBHOOK_SECRET: Env.schema.string.optional(),

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
  | Sans `SENTRY_DSN`, rien n'est envoyé.
  */
  SENTRY_DSN: Env.schema.string.optional(),
  SENTRY_ENVIRONMENT: Env.schema.string.optional(),
  SENTRY_RELEASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Stockage des fichiers (exports PDF) — voir config/cloudinary.ts
  |----------------------------------------------------------
  | Optionnelles au schéma (dev et test tournent sans), requises
  | en production : config/cloudinary.ts refuse de démarrer sinon.
  */
  CLOUDINARY_CLOUD_NAME: Env.schema.string.optional(),
  CLOUDINARY_API_KEY: Env.schema.string.optional(),
  CLOUDINARY_API_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | E-mails — voir docs/MAIL.md
  |----------------------------------------------------------
  | `MAIL_PROVIDER` : `console` par défaut. `MAIL_FROM_EMAIL` est
  | exigé à l'envoi en production (services mail). `MAIL_RESEND_TEST_*`
  | ne sert qu'hors production (boîtes de test Resend).
  */
  MAIL_PROVIDER: Env.schema.enum.optional(['console', 'resend'] as const),
  MAIL_FROM_EMAIL: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),
  RESEND_API_KEY: Env.schema.string.optional(),
  ADMIN_CONTACT_EMAIL: Env.schema.string.optional(),
  MAIL_RESEND_TEST_MODE: Env.schema.boolean.optional(),
  MAIL_RESEND_TEST_EVENT: Env.schema.enum.optional([
    'delivered',
    'bounced',
    'complained',
    'suppressed',
  ] as const),
  MAIL_RESEND_TEST_TO: Env.schema.string.optional(),
  MAIL_RESEND_TEST_FROM: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Compte super admin — database/seeders/admin_seeder.ts
  |----------------------------------------------------------
  | Requis seulement pour `node ace db:seed --files …admin_seeder`.
  | `ADMIN_EMAIL` remplace l'e-mail par défaut du super admin.
  */
  ADMIN_PASSWORD: Env.schema.string.optional(),
  ADMIN_EMAIL: Env.schema.string.optional(),
}
