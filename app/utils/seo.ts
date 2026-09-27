/**
 * Directives d'indexation (`config/seo.ts`) : balise `<meta name="robots">`
 * du layout et `GET /robots.txt`.
 */

export const ROBOTS_META = {
  INDEX: 'index, follow',
  NOINDEX: 'noindex, nofollow',
} as const
export type RobotsMeta = (typeof ROBOTS_META)[keyof typeof ROBOTS_META]

export function robotsMetaContent(indexing: boolean): RobotsMeta {
  return indexing ? ROBOTS_META.INDEX : ROBOTS_META.NOINDEX
}

export function robotsTxt(indexing: boolean): string {
  return `User-agent: *\n${indexing ? 'Allow' : 'Disallow'}: /\n`
}
