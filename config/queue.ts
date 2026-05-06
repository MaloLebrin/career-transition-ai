import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/queue'

export default defineConfig({
  /**
   * Default adapter used for dispatching jobs.
   * We use the database adapter (PostgreSQL via Lucid).
   */
  default: env.get('QUEUE_DRIVER', 'database'),

  /**
   * Registered queue adapters.
   */
  adapters: {
    database: drivers.database({
      /**
       * Uses the primary Lucid connection.
       */
      connectionName: env.get('NODE_ENV') === 'test' ? 'sqlite' : 'postgres',
    }),
    /**
     * Sync adapter: useful for local development or simple scripts
     * when you want jobs to run inline without a separate worker.
     */
    sync: drivers.sync(),
  },

  /**
   * Global worker configuration. These settings are used by the
   * `node ace queue:work` command.
   */
  worker: {
    concurrency: 5,
    idleDelay: '2s',
    gracefulShutdown: true,
  },

  /**
   * En dev : fichiers .ts source. En production : JS compilés dans build/.
   */
  locations: [env.get('NODE_ENV') === 'production' ? './build/app/jobs/**/*.js' : './app/jobs/**/*.ts'],
})
