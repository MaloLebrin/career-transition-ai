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
  employeeId: number
  type: ExerciceResultType
  lastUpdated: string
  data: any
}
