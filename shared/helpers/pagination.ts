import { LIST_SEARCH_MAX_LENGTH } from '#shared/constants/pagination'
import type { ListParams } from '#shared/types/pagination'

/** Numéro de page lu depuis la query string : entier ≥ 1, `1` sinon. */
export function parsePage(raw: unknown): number {
  const page = Number.parseInt(String(raw ?? '1'), 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

/** Terme de recherche : texte rogné et borné, chaîne vide si absent ou non textuel. */
export function parseSearch(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().slice(0, LIST_SEARCH_MAX_LENGTH)
}

/** Paramètres `page` + `search` d'une query string. */
export function parseListParams(qs: Record<string, unknown>): ListParams {
  return { page: parsePage(qs.page), search: parseSearch(qs.search) }
}

/**
 * Query string d'une liste à partir de ses paramètres : les valeurs par défaut
 * (page 1, texte vide, filtre `all`) sont omises pour garder des URL propres.
 */
export function listQuery(params: Record<string, string | number | null | undefined>) {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue
    const text = String(value)
    if (text === '' || text === 'all' || (key === 'page' && text === '1')) continue
    query[key] = text
  }
  return query
}

/** Échappe `%`, `_` et `\` d'un terme destiné à un `LIKE` / `ILIKE` (recherche littérale). */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`)
}
