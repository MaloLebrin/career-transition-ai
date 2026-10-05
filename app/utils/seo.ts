/**
 * Directives d'indexation (`config/seo.ts`) : balise `<meta name="robots">`
 * du layout, `GET /robots.txt`, `GET /sitemap.xml`, canonical et `X-Robots-Tag`.
 */

export const ROBOTS_META = {
  INDEX: 'index, follow',
  NOINDEX: 'noindex, nofollow',
} as const
export type RobotsMeta = (typeof ROBOTS_META)[keyof typeof ROBOTS_META]

/** Pages publiques indexables (`start/routes/public.ts`), listées dans le sitemap. */
export const SITEMAP_PATHS = [
  '/',
  '/tarifs',
  '/cabinets',
  '/cabinets/tarifs',
  '/offre',
  '/methodologie',
  '/securite',
  '/confidentialite',
  '/mentions-legales',
  '/cgu',
  '/cgv',
] as const

/** Espaces privés ou fonctionnels : jamais indexés, quel que soit `SEO_INDEXING`. */
export const NOINDEX_PATH_PREFIXES = ['/auth', '/dashboard', '/onboarding', '/inscription'] as const

export function robotsMetaContent(indexing: boolean): RobotsMeta {
  return indexing ? ROBOTS_META.INDEX : ROBOTS_META.NOINDEX
}

export function robotsTxt(indexing: boolean, sitemapUrl?: string): string {
  if (!indexing) return 'User-agent: *\nDisallow: /\n'
  const lines = ['User-agent: *', 'Allow: /']
  for (const prefix of NOINDEX_PATH_PREFIXES) lines.push(`Disallow: ${prefix}`)
  if (sitemapUrl) lines.push('', `Sitemap: ${sitemapUrl}`)
  return `${lines.join('\n')}\n`
}

export function sitemapXml(urls: string[]): string {
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** `/auth/login`, `/dashboard/…` : préfixe entier, `/authx` n'en fait pas partie. */
export function isNoindexPath(path: string): boolean {
  return NOINDEX_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/** URL canonique : base absolue + chemin sans slash final ni query string. */
export function canonicalUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '')
  const cleanPath = path.split('?')[0].replace(/\/+$/, '')
  return `${cleanBase}${cleanPath}` || cleanBase
}

/** Cible du 301 pour `/tarifs/` → `/tarifs` ; `null` si l'URL est déjà canonique. */
export function trailingSlashTarget(url: string): string | null {
  const [path, ...query] = url.split('?')
  if (path.length <= 1 || !path.endsWith('/')) return null
  const target = path.replace(/\/+$/, '') || '/'
  return query.length ? `${target}?${query.join('?')}` : target
}
