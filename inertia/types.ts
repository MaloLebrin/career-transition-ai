export { EXERCICE_RESULTS_TYPES } from '../shared/constants/exercises'
export type { ExerciceResultType } from '../shared/constants/exercises'

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
export * from './types/Skill'
export * from './types/PersonalityData'
export * from './types/JobType'
export * from './types/Experience'
export * from './types/Education'
export * from './types/ExerciseResult'
export * from './types/SupportPlanStep'
export * from './types/Employee'

export type AdvisorRole = 'admin' | 'expert' | 'consultant'

export interface Organization {
  id: number
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
}

export interface Advisor {
  id: number
  organizationId: number
  email: string
  name: string
  role: AdvisorRole
}
