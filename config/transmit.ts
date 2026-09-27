import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  /**
   * Keep-alive des connexions SSE (`/__transmit/events`) : sans ping, les
   * reverse proxys coupent les connexions inactives au bout de ~60–100 s et
   * le navigateur se reconnecte en boucle.
   */
  pingInterval: '30s',

  /**
   * Pas de transport partagé : les `transmit.broadcast()` ne sont diffusés
   * qu'aux clients connectés au **même process**. Ceux émis depuis le worker
   * de queue n'atteignent donc jamais le navigateur (voir docs/QUEUES.md,
   * « Notes prod ») ; brancher le transport Redis pour un déploiement
   * multi-process temps réel.
   */
  transport: null,
})
