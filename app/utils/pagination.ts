import { escapeLike } from '#shared/helpers/pagination'
import type { PaginationMeta } from '#shared/types/pagination'

/** Méta de pagination à partir du paginateur Lucid. */
export function paginationMeta(
  paginator: { currentPage: number; total: number; lastPage: number },
  pageSize: number
): PaginationMeta {
  return {
    page: paginator.currentPage,
    pageSize,
    total: paginator.total,
    lastPage: paginator.lastPage,
  }
}

/** Motif `ILIKE` « contient » d'un terme, caractères spéciaux échappés. */
export function containsPattern(term: string): string {
  return `%${escapeLike(term)}%`
}

/**
 * Ajoute au `where` d'une requête un groupe « l'une des colonnes contient le
 * terme » (insensible à la casse). Sans terme, la requête reste inchangée.
 */
export function whereAnyColumnContains<
  Q extends { where: (callback: (builder: any) => void) => Q },
>(query: Q, columns: string[], term: string): Q {
  if (!term) return query
  const pattern = containsPattern(term)
  return query.where((builder) => {
    for (const column of columns) builder.orWhereILike(column, pattern)
  })
}
