import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, drivers } from '@adonisjs/queue'

/**
 * Rétention des jobs terminés dans `queue_jobs` (issue #28).
 *
 * Par défaut, `@boringnode/queue` supprime un job dès qu'il se termine, succès
 * comme échec : la table reste petite mais un job en échec ne laisse aucune
 * trace (message d'erreur compris). On garde un historique borné, par queue,
 * en âge **et** en nombre, pour tenir dans le quota Neon (docs/hosting.md) :
 * l'élagage a lieu à chaque fin de job de la même queue.
 */
export const QUEUE_JOB_RETENTION = {
  completed: { age: '7d', count: 1000 },
  failed: { age: '30d', count: 1000 },
} as const

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
   * Options par défaut de tous les jobs (priorité : job > queue > global).
   */
  defaultJobOptions: {
    removeOnComplete: QUEUE_JOB_RETENTION.completed,
    removeOnFail: QUEUE_JOB_RETENTION.failed,
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
