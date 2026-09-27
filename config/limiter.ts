import { defineConfig, stores } from '@adonisjs/limiter'

/**
 * Rate limiting des endpoints publics (issue #23), défini dans
 * `start/limiter.ts`.
 *
 * Store `memory` : un seul process web sert le HTTP (le worker de queue n'en
 * sert pas). Les compteurs repartent à zéro au redémarrage, ce qui suffit contre
 * la force brute et le spam. Plusieurs instances web → passer au store
 * `database` (table `rate_limits`, `node ace make:migration` depuis le stub du
 * package) pour partager les compteurs.
 */
const limiterConfig = defineConfig({
  default: 'memory',
  stores: {
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
