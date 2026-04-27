import { type EmployeeStatus } from '#shared/constants/employee'
import { type ExperienceType } from '#shared/constants/experience'
import { Education } from './Education'
import { ExerciseResult } from './ExerciseResult'
import { Experience } from './Experience'
import { Skill } from './Skill'
import { SupportPlanStep } from './SupportPlanStep'

export interface Employee {
  id: number
  organizationId: number
  advisorId?: number
  name: string
  email: string
  currentRole: string
  targetRole?: string
  skills: Skill[]
  summary?: string
  advisorNotes?: string
  experiences: Experience[]
  educations: Education[]
  status: EmployeeStatus
  onboarded: boolean
  exercises: ExerciseResult[]
  plan: SupportPlanStep[]
}

export type { EmployeeStatus }

export type EmployeeData = {
  id: number
  organizationId: number
  userId: number
  name: string
  email: string
  currentRole: string
  targetRole: string | null
  summary: string | null
  advisorNotes: string | null
  status: string
  onboarded: boolean
  createdAt: string
  updatedAt: string
  skills: Array<{
    id: number
    name: string
    category: string | null
    level: number
  }>
  exercises: Array<{
    id: number
    type: string
    status: string
    date: string | null
    quantitativeScore: number | null
    progressPercent?: number | null
  }>
  plan: Array<{
    id: number
    title?: string | null
    description?: string | null
    instructions?: string | null
    scheduledAt?: string | null
    status?: string
    locationOrLink?: string | null
    completed: boolean
    associatedExercises?: string[] | null
    isLocked?: boolean
    sortOrder?: number | null
  }>
  experiences: Array<{
    id: number
    title: string
    company: string
    startDate: string
    endDate: string | null
    description: string
    type: ExperienceType | null
    isCurrent: boolean | null
    sortOrder: number | null
  }>
  educations: Array<{
    id: number
    degree: string
    school: string
    startDate: string
    endDate: string | null
    description: string
    isCurrent: boolean | null
    sortOrder: number | null
  }>
  // TODO: use model types to generate this type
}

export interface AccompanimentProgress {
  employeeId: number
  name: string
  email: string
  status: EmployeeStatus
  onboarded: boolean
  targetRole: string | null
  completedSteps: number
  totalSteps: number
  progressPercent: number
  nextAppointment: {
    stepId: number
    title: string | null
    scheduledAt: string
  } | null
}

export interface AdvisorHomeStats {
  totalActive: number
  pendingOnboarding: number
  upcomingCount: number
  completedStepsThisMonth: number
}

export interface UpcomingAppointment {
  stepId: number
  employeeId: number
  employeeName: string
  title: string | null
  scheduledAt: string
  locationOrLink: string | null
}

export interface AdvisorHomeProps {
  stats: AdvisorHomeStats
  accompaniments: AccompanimentProgress[]
  upcomingAppointments: UpcomingAppointment[]
}
