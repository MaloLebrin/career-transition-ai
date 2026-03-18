export type EmployeeStatus = 'active' | 'completed' | 'on-hold'

export type SkillDto = {
  name: string
  level: number
}

export type ExperienceDto = {
  id: number
  title: string
  company: string
  type?: 'CDI' | 'CDD' | 'Alternance' | 'Freelance' | 'Stage'
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
}

export type EducationDto = {
  id: number
  degree: string
  school: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
}

export type ExerciseResultDto = {
  id: number
  type:
    | 'MOTIVATION'
    | 'VALUES'
    | 'PERSONALITY'
    | 'COMPETENCIES'
    | 'LIFE_CURVE'
    | 'CV_ANALYSIS'
    | 'TARGETING'
    | 'DISC'
    | 'CIRCLE_OF_CONTROL'
    | 'SKILL_MAPPING'
  date: string
  duration: number
  data: unknown
  quantitativeScore: number
  qualitativeAnalysis?: string
}

export type SupportPlanStepStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type SupportPlanStepDto = {
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
  associatedExercises?: ExerciseResultDto['type'][]
  lastUpdated?: string
  isLocked?: boolean
  sortOrder?: number
}

export type EmployeeDto = {
  id: number
  organizationId: number
  advisorId?: number
  name: string
  email: string
  currentRole: string
  targetRole?: string
  skills: SkillDto[]
  summary?: string
  advisorNotes?: string
  experiences: ExperienceDto[]
  educations: EducationDto[]
  status: EmployeeStatus
  onboarded: boolean
  exercises: ExerciseResultDto[]
  plan: SupportPlanStepDto[]
}
