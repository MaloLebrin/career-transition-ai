export * from './types/education'
export * from './types/exercise_result'
export * from './types/experience'
export * from './types/job_type'
export * from './types/organization'
export * from './types/personality_data'
export * from './types/skill'
export * from './types/support_plan_step'

export const ExerciseType = {
  MOTIVATION: 'motivation',
  VALUES: 'values',
  PERSONALITY: 'personality',
  COMPETENCIES: 'competencies',
  LIFE_CURVE: 'life_curve',
  CV_ANALYSIS: 'cv_analysis',
  TARGETING: 'targeting',
  DISC: 'disc',
  CIRCLE_OF_CONTROL: 'circle_of_control',
  SKILL_MAPPING: 'skill_mapping',
} as const

export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType]

export interface Organization {
  id: number
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
}
