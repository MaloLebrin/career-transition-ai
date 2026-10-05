import { trailingSlashTarget } from '#utils/seo'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * `/tarifs/` → 301 vers `/tarifs` : une seule URL par page (canonical, sitemap).
 * Lectures seulement : un POST redirigé perdrait son corps.
 */
export default class TrailingSlashMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    if (request.method() === 'GET' || request.method() === 'HEAD') {
      const target = trailingSlashTarget(request.url(true))
      if (target) return response.redirect().status(301).toPath(target)
    }
    return next()
  }
}
