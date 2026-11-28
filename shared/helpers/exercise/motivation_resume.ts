import type { MotivationMatrix, MotivationResumeState } from '#shared/types/exercise/motivation'

/** Nombre de motivations comparées deux à deux (231 duels). */
export const MOTIVATION_COUNT = 22

export function emptyMotivationMatrix(): MotivationMatrix {
  return Array.from({ length: MOTIVATION_COUNT }, () =>
    Array.from({ length: MOTIVATION_COUNT }, () => null)
  )
}

function normalizeMatrix(raw: unknown): MotivationMatrix {
  const rows = Array.isArray(raw) ? raw : []
  return emptyMotivationMatrix().map((row, i) =>
    row.map((_, j) => {
      const cell = Array.isArray(rows[i]) ? rows[i][j] : null
      return Number.isInteger(cell) && cell >= 0 && cell < MOTIVATION_COUNT ? cell : null
    })
  )
}

function isDuel(i: unknown, j: unknown): i is number {
  return (
    Number.isInteger(i) &&
    Number.isInteger(j) &&
    (i as number) >= 0 &&
    (i as number) < (j as number) &&
    (j as number) < MOTIVATION_COUNT
  )
}

/**
 * Reprise de l'exercice Motivations à partir de données enregistrées (brouillon ou
 * résultat terminé). Garde la position enregistrée si elle désigne un duel non joué,
 * sinon reprend au premier duel non joué. Renvoie `null` quand il n'y a rien à
 * reprendre — données absentes, aucun duel joué ou matrice complète (exercice terminé) :
 * l'outil repart alors de l'écran d'accueil avec une matrice vide.
 */
export function motivationResumeState(data: unknown): MotivationResumeState | null {
  const source = (data ?? {}) as { matrix?: unknown; currentI?: unknown; currentJ?: unknown }
  const matrix = normalizeMatrix(source.matrix)
  const duels = matrix.flatMap((row, i) =>
    row.slice(i + 1).map((cell, k) => ({ i, j: i + 1 + k, cell }))
  )
  const firstOpen = duels.find((duel) => duel.cell === null)
  if (!firstOpen || duels.every((duel) => duel.cell === null)) return null

  const { currentI, currentJ } = source
  if (isDuel(currentI, currentJ) && matrix[currentI][currentJ as number] === null) {
    return { matrix, currentI, currentJ: currentJ as number }
  }
  return { matrix, currentI: firstOpen.i, currentJ: firstOpen.j }
}
