export type EmployeeStatus = 'active' | 'completed' | 'on-hold'

export type SkillDto = {
  name: string
  level: number
}

export type ExperienceDto = {
  id: string
  title: string
  company: string
  type?: 'CDI' | 'CDD' | 'Alternance' | 'Freelance' | 'Stage'
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
}

export type EducationDto = {
  id: string
  degree: string
  school: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
}

export type ExerciseResultDto = {
  id: string
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

export type SupportPlanStepDto = {
  id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  notes?: string
  associatedExercise?: ExerciseResultDto['type']
  lastUpdated?: string
}

export type EmployeeDto = {
  id: string
  organizationId: string
  advisorId?: string
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
  nextAppointment?: string
  plan: SupportPlanStepDto[]
}

