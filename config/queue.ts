import env from '#start/env'
import app from '@adonisjs/core/services/app'
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
   * En dev/test : fichiers .ts source. En production : JS compilés.
   *
   * `@boringnode/queue` globbe ces motifs relativement au `cwd` du process :
   * un chemin relatif ne fonctionne que si le worker est lancé depuis la
   * racine du dépôt (`node build/bin/console.js …`) et casse depuis `build/`
   * (`cd build && node bin/console.js …`) — aucun job enregistré, avertissement
   * « No jobs found for locations ». On résout donc le motif en absolu par
   * rapport à la racine de l'app (qui est `build/` en production).
   */
  locations: [app.makePath(app.inProduction ? 'app/jobs/**/*.js' : 'app/jobs/**/*.ts')],
})
