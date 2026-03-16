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
  nextAppointment?: string
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
  }>
  plan: Array<{
    id: number
    title: string
    description: string | null
    completed: boolean
    associatedExercise: string | null
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
