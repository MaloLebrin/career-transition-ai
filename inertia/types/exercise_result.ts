import { ExerciceResultType } from '../../shared/constants/exercises'

export interface ExerciseResult {
  id: number
  type: ExerciceResultType
  date: string
  duration: number
  data: any
  progressPercent?: number
  quantitativeScore: number
  qualitativeAnalysis?: string
  /** #101 : résultat réservé au forfait (B2C non payé) — `data` vidé, score à 0, analyse retirée. */
  locked?: true
  /** #101 : résultat visible mais analyse IA réservée au forfait. */
  analysisLocked?: true
}

export interface ExerciseDraft {
  /** API validator expects a string; server-loaded drafts may still use a numeric id in JSON. */
  employeeId: string | number
  type: ExerciceResultType
  lastUpdated: string
  data: any
}
