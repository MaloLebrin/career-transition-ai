import { describe, test, expect } from 'vitest'
import {
  RANKING_EXTREMES_COUNT,
  rankingExtremes,
} from '../../../../shared/helpers/exercise/ranking_extremes'

const labels = (n: number) => Array.from({ length: n }, (_, i) => `M${i + 1}`)
const ranks = (items: { rank: number }[]) => items.map((item) => item.rank)

describe('shared/helpers/exercise/ranking_extremes', () => {
  test('affiche 5 motivations de chaque côté par défaut', () => {
    expect(RANKING_EXTREMES_COUNT).toBe(5)
  })

  test('22 motivations : rangs 1 à 5 puis 18 à 22, dans l’ordre du classement', () => {
    const { top, bottom } = rankingExtremes(labels(22))
    expect(top).toEqual([1, 2, 3, 4, 5].map((rank) => ({ rank, label: `M${rank}` })))
    expect(bottom).toEqual([18, 19, 20, 21, 22].map((rank) => ({ rank, label: `M${rank}` })))
  })

  test('classement court : aucun élément dans les deux listes', () => {
    const extremes = rankingExtremes(labels(7))
    expect(ranks(extremes.top)).toEqual([1, 2, 3, 4, 5])
    expect(ranks(extremes.bottom)).toEqual([6, 7])
    expect(rankingExtremes(labels(4)).bottom).toEqual([])
  })

  test('nombre explicite', () => {
    const { top, bottom } = rankingExtremes(labels(22), 3)
    expect(ranks(top)).toEqual([1, 2, 3])
    expect(ranks(bottom)).toEqual([20, 21, 22])
  })

  test('entrée vide ou invalide : listes vides', () => {
    expect(rankingExtremes([])).toEqual({ top: [], bottom: [] })
    expect(rankingExtremes(undefined)).toEqual({ top: [], bottom: [] })
    expect(rankingExtremes({ a: 1 })).toEqual({ top: [], bottom: [] })
  })
})
