import { ExerciceResultType } from '../../shared/constants/exercises'

export interface ExerciseResult {
  id: number
  type: ExerciceResultType
  date: string
  duration: number
  data: any
  quantitativeScore: number
  qualitativeAnalysis?: string
}

export interface ExerciseDraft {
  /** API validator expects a string; server-loaded drafts may still use a numeric id in JSON. */
  employeeId: string | number
  type: ExerciceResultType
  lastUpdated: string
  data: any
}
