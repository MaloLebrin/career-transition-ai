import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    /**
     * Chemin résolu relativement à la racine de l'app, qui est `build/` en
     * production : ne jamais le préfixer par `build/` (→ `build/build/…`,
     * ERR_MODULE_NOT_FOUND et 500 sur toutes les pages).
     */
    bundle: 'ssr/ssr.js',
  },
})
