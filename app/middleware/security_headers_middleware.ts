import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Fonctionnalités du navigateur dont l'application n'a pas besoin (#67) :
 * refusées à la page comme à tout contenu embarqué.
 */
export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'camera=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
  'browsing-topics=()',
].join(', ')

/**
 * En-têtes de sécurité non couverts par Shield (repris de boat-management).
 *
 * `Referrer-Policy: strict-origin-when-cross-origin` : une page qui affiche le
 * logo (servi par Cloudinary) n'envoie que l'origine du site, jamais son URL
 * complète (qui peut contenir un id de candidat).
 *
 * `Permissions-Policy` : caméra, micro, géolocalisation, paiement… désactivés.
 */
export default class SecurityHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.header('Permissions-Policy', PERMISSIONS_POLICY)
    return next()
  }
}
