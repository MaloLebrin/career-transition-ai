import { ExerciseType } from './ExerciseType'

export type SupportPlanStepStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface SupportPlanStep {
  id: number
  title?: string
  description?: string
  instructions?: string
  dueDate?: string
  scheduledAt?: string
  endedAt?: string
  status: SupportPlanStepStatus
  locationOrLink?: string
  completed: boolean
  notes?: string
  associatedExercises?: ExerciseType[]
  lastUpdated?: string
  isLocked?: boolean
  sortOrder?: number
}
