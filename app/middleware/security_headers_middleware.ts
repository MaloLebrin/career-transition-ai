import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * En-têtes de sécurité non couverts par Shield (repris de boat-management).
 *
 * `Referrer-Policy: strict-origin-when-cross-origin` : une page qui affiche le
 * logo (servi par Cloudinary) n'envoie que l'origine du site, jamais son URL
 * complète (qui peut contenir un id de candidat).
 */
export default class SecurityHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    return next()
  }
}
