import { describe, expect, test } from 'vitest'
import {
  MOTIVATION_COUNT,
  emptyMotivationMatrix,
  motivationResumeState,
} from '../../../../shared/helpers/exercise/motivation_resume'

function filledMatrix(upTo = Number.POSITIVE_INFINITY) {
  let played = 0
  return emptyMotivationMatrix().map((row, i) =>
    row.map((_, j) => (j > i && played++ < upTo ? i : null))
  )
}

describe('motivationResumeState', () => {
  test('matrice vide 22 × 22', () => {
    const matrix = emptyMotivationMatrix()
    expect(matrix).toHaveLength(MOTIVATION_COUNT)
    expect(
      matrix.every((row) => row.length === MOTIVATION_COUNT && row.every((c) => c === null))
    ).toBe(true)
  })

  test('rien à reprendre sans données ou sans duel joué', () => {
    expect(motivationResumeState(undefined)).toBeNull()
    expect(motivationResumeState({})).toBeNull()
    expect(
      motivationResumeState({ matrix: emptyMotivationMatrix(), currentI: 0, currentJ: 1 })
    ).toBeNull()
  })

  // Non-régression : un résultat terminé (ranked/scores/matrix, sans currentI/currentJ)
  // était repris tel quel par l'outil, qui affichait « NaN% » et des options vides.
  test('résultat terminé : rien à reprendre', () => {
    expect(
      motivationResumeState({ ranked: [], scores: {}, matrix: filledMatrix(), step: 2 })
    ).toBeNull()
  })

  test('garde la position enregistrée quand elle désigne un duel non joué', () => {
    const resume = motivationResumeState({ matrix: filledMatrix(3), currentI: 0, currentJ: 4 })
    expect(resume).toMatchObject({ currentI: 0, currentJ: 4 })
    expect(resume!.matrix[0][1]).toBe(0)
  })

  test('sans position valide, reprend au premier duel non joué', () => {
    expect(motivationResumeState({ matrix: filledMatrix(21) })).toMatchObject({
      currentI: 1,
      currentJ: 2,
    })
    expect(
      motivationResumeState({ matrix: filledMatrix(3), currentI: 0, currentJ: 2 })
    ).toMatchObject({ currentI: 0, currentJ: 4 })
    expect(
      motivationResumeState({ matrix: filledMatrix(3), currentI: 'x', currentJ: 99 })
    ).toMatchObject({ currentI: 0, currentJ: 4 })
  })

  test('ignore les cellules invalides et complète une matrice tronquée', () => {
    const resume = motivationResumeState({ matrix: [[null, 0, 'a', 99]] })
    expect(resume).toMatchObject({ currentI: 0, currentJ: 2 })
    expect(resume!.matrix).toHaveLength(MOTIVATION_COUNT)
    expect(resume!.matrix[0][3]).toBeNull()
  })
})
