import { appUrl } from '#utils/app_url'
import { SITEMAP_PATHS, sitemapXml } from '#utils/seo'
import type { HttpContext } from '@adonisjs/core/http'

/** `GET /sitemap.xml` : pages publiques indexables, URLs absolues dérivées d'`APP_URL`. */
export default class SitemapController {
  handle({ response }: HttpContext) {
    response.header('content-type', 'application/xml; charset=utf-8')
    return sitemapXml(SITEMAP_PATHS.map((path) => appUrl(path === '/' ? '' : path)))
  }
}
