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
       * Uses the primary Lucid connection (PostgreSQL).
       */
      connectionName: 'postgres',
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
   * Locations where job classes live.
   */
  locations: ['./app/jobs/**/*.ts'],
})
