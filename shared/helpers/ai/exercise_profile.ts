import type Employee from '#models/employee'
import type Education from '#models/education'
import type Experience from '#models/experience'
import type Skill from '#models/skill'

export interface EmployeeAiProfile {
  name: string
  currentRole: string
  targetRole: string
  summary: string
  skills: Array<{ name: string; level: number }>
  experiences: Array<{
    title: string
    company: string
    type: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
  educations: Array<{
    degree: string
    school: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
}

function toIsoDate(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value?.toISODate === 'function') return value.toISODate() || ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return ''
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function clampLevel(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 3
  return Math.min(5, Math.max(1, Math.round(n)))
}

type EmployeeLoaded = Employee & {
  skills?: Array<Skill & { $extras?: { pivot_level?: number } }>
  experiences?: Experience[]
  educations?: Education[]
}

export function buildEmployeeAiProfile(employee: EmployeeLoaded): EmployeeAiProfile {
  const skills = Array.isArray(employee.skills) ? employee.skills : []
  const experiences = Array.isArray(employee.experiences) ? employee.experiences : []
  const educations = Array.isArray(employee.educations) ? employee.educations : []

  return {
    name: toSafeString((employee as any).name),
    currentRole: toSafeString((employee as any).currentRole),
    targetRole: toSafeString((employee as any).targetRole),
    summary: toSafeString((employee as any).summary),
    skills: skills
      .map((s: any) => ({
        name: toSafeString(s?.name),
        level: clampLevel(s?.$extras?.pivot_level),
      }))
      .filter((s) => s.name),
    experiences: experiences.map((exp: any) => ({
      title: toSafeString(exp?.title),
      company: toSafeString(exp?.company),
      type: toSafeString(exp?.type),
      startDate: toIsoDate(exp?.startDate),
      endDate: toIsoDate(exp?.endDate),
      isCurrent: Boolean(exp?.isCurrent),
      description: toSafeString(exp?.description),
    })),
    educations: educations.map((edu: any) => ({
      degree: toSafeString(edu?.degree),
      school: toSafeString(edu?.school),
      startDate: toIsoDate(edu?.startDate),
      endDate: toIsoDate(edu?.endDate),
      isCurrent: Boolean(edu?.isCurrent),
      description: toSafeString(edu?.description),
    })),
  }
}

