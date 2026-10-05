import { appUrl } from '#utils/app_url'
import { robotsTxt } from '#utils/seo'
import type { HttpContext } from '@adonisjs/core/http'
import config from '@adonisjs/core/services/config'

/** `GET /robots.txt`, aligné sur `SEO_INDEXING` (`config/seo.ts`). */
export default class RobotsController {
  handle({ response }: HttpContext) {
    response.header('content-type', 'text/plain; charset=utf-8')
    return robotsTxt(config.get<boolean>('seo.indexing'), appUrl('/sitemap.xml'))
  }
}
