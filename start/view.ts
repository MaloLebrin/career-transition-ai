/*
|--------------------------------------------------------------------------
| Globaux Edge
|--------------------------------------------------------------------------
|
| `seo` : balises d'indexation du layout (`resources/views/inertia_layout.edge`),
| calculées à chaque rendu depuis `config/seo.ts`.
|
*/

import { robotsMetaContent } from '#utils/seo'
import config from '@adonisjs/core/services/config'
import edge from 'edge.js'

edge.global('seo', {
  robots: () => robotsMetaContent(config.get<boolean>('seo.indexing')),
  googleSiteVerification: () => config.get<string | undefined>('seo.googleSiteVerification'),
})
