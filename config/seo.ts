import env from '#start/env'

/**
 * Référencement de l'application par les moteurs de recherche.
 *
 * `noindex` par défaut, **y compris en production** : pendant la beta, l'app
 * est servie sur une URL provisoire (Render, sslip.io…) qui ne doit pas être
 * indexée. `SEO_INDEXING=true` uniquement sur le domaine final.
 *
 * Lue à chaque rendu (balises du layout via le global Edge `seo`,
 * `start/view.ts`) et par `GET /robots.txt` : les tests la basculent avec
 * `config.set()`.
 */
const seoConfig = {
  indexing: env.get('SEO_INDEXING', false),
  /** Jeton Google Search Console : la balise n'est rendue que s'il est défini. */
  googleSiteVerification: env.get('GOOGLE_SITE_VERIFICATION'),
}

export default seoConfig
