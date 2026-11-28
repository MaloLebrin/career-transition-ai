import type { RankingExtremes } from '#shared/types/exercise/ranking'

export const RANKING_EXTREMES_COUNT = 5

/**
 * Les `count` premiers et les `count` derniers éléments d'un classement, avec leur rang
 * réel (1 à 5 … 18 à 22), dans l'ordre du classement. Un élément n'apparaît jamais
 * dans les deux listes quand le classement est court.
 */
export function rankingExtremes(
  ranked: unknown,
  count: number = RANKING_EXTREMES_COUNT
): RankingExtremes {
  const labels = Array.isArray(ranked)
    ? ranked.filter((label): label is string => typeof label === 'string')
    : []
  const items = labels.map((label, index) => ({ rank: index + 1, label }))
  const bottomStart = Math.max(count, items.length - count)
  return { top: items.slice(0, count), bottom: items.slice(bottomStart) }
}
