/** Matrice des duels Motivations : `matrix[i][j]` (i < j) vaut l'index gagnant, ou `null`. */
export type MotivationMatrix = (number | null)[][]

/** Position de reprise de l'exercice Motivations : la matrice et le prochain duel à jouer. */
export type MotivationResumeState = {
  matrix: MotivationMatrix
  currentI: number
  currentJ: number
}
