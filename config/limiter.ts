import env from '#start/env'
import { LIMITER_STORES, RATE_LIMITS_TABLE } from '#shared/constants/runtime_stores'
import { defineConfig, stores } from '@adonisjs/limiter'

/**
 * Rate limiting des endpoints publics (issue #23), défini dans
 * `start/limiter.ts`.
 *
 * Store `database` par défaut (#172) : table `rate_limits` de Postgres,
 * compteurs partagés par toutes les instances web et conservés au
 * redémarrage. Les lignes expirées sont purgées toutes les 5 minutes
 * (`clearExpiredByTimeout`). `LIMITER_STORE=memory` : compteurs propres au
 * process, perdus au redémarrage (dépannage seulement).
 */
const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE', LIMITER_STORES.DATABASE),
  stores: {
    database: stores.database({
      tableName: RATE_LIMITS_TABLE,
      clearExpiredByTimeout: true,
    }),
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
