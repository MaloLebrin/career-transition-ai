import { describe, test, expect } from 'vitest'
import { rankingExtremes } from '../../../../shared/helpers/exercise/ranking_extremes'

const labels = (n: number) => Array.from({ length: n }, (_, i) => `M${i + 1}`)

describe('shared/helpers/exercise/ranking_extremes', () => {
  test('22 motivations : rangs 1-2-3 puis 20-21-22, dans l’ordre du classement', () => {
    const { top, bottom } = rankingExtremes(labels(22))
    expect(top).toEqual([
      { rank: 1, label: 'M1' },
      { rank: 2, label: 'M2' },
      { rank: 3, label: 'M3' },
    ])
    expect(bottom).toEqual([
      { rank: 20, label: 'M20' },
      { rank: 21, label: 'M21' },
      { rank: 22, label: 'M22' },
    ])
  })

  test('classement court : aucun élément dans les deux listes', () => {
    expect(rankingExtremes(labels(4))).toEqual({
      top: [
        { rank: 1, label: 'M1' },
        { rank: 2, label: 'M2' },
        { rank: 3, label: 'M3' },
      ],
      bottom: [{ rank: 4, label: 'M4' }],
    })
    expect(rankingExtremes(labels(2)).bottom).toEqual([])
  })

  test('entrée vide ou invalide : listes vides', () => {
    expect(rankingExtremes([])).toEqual({ top: [], bottom: [] })
    expect(rankingExtremes(undefined)).toEqual({ top: [], bottom: [] })
    expect(rankingExtremes({ a: 1 })).toEqual({ top: [], bottom: [] })
  })
})
