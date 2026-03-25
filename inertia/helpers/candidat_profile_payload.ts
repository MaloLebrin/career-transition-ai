import type { Employee, Experience, Education, Skill } from '~/types'

type ExperiencePayload = Pick<
  Experience,
  'title' | 'company' | 'type' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
>

type EducationPayload = Pick<
  Education,
  'degree' | 'school' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
>

type SkillPayload = Pick<Skill, 'name' | 'level'>

function toExperiencePayload(exp: Partial<Experience>): ExperiencePayload {
  return {
    title: exp.title ?? '',
    company: exp.company ?? '',
    type: exp.type,
    startDate: exp.startDate ?? '',
    endDate: exp.endDate,
    isCurrent: !!exp.isCurrent,
    description: exp.description ?? '',
  }
}

function toEducationPayload(edu: Partial<Education>): EducationPayload {
  return {
    degree: edu.degree ?? '',
    school: edu.school ?? '',
    startDate: edu.startDate ?? '',
    endDate: edu.endDate,
    isCurrent: !!edu.isCurrent,
    description: edu.description ?? '',
  }
}

function toSkillPayload(skill: Partial<Skill>): SkillPayload {
  return {
    name: String(skill.name ?? '').trim(),
    level: Number(skill.level ?? 3),
  }
}

/**
 * Payload for PUT /dashboard/candidat/profile (AuthController.updateProfileCandidat).
 * Includes onboarding-related data (experiences, educations, skills) and omits IDs.
 */
export function candidatProfileUpdatePayload(employee: Partial<Employee>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (employee.name !== undefined) payload.name = employee.name
  if (employee.email !== undefined) payload.email = employee.email
  if (employee.currentRole !== undefined) payload.currentRole = employee.currentRole
  if (employee.targetRole !== undefined) payload.targetRole = employee.targetRole
  if (employee.summary !== undefined) payload.summary = employee.summary
  if (employee.onboarded !== undefined) payload.onboarded = employee.onboarded

  if (employee.experiences !== undefined) {
    payload.experiences = (employee.experiences ?? []).map((e) => toExperiencePayload(e as any))
  }
  if (employee.educations !== undefined) {
    payload.educations = (employee.educations ?? []).map((e) => toEducationPayload(e as any))
  }
  if (employee.skills !== undefined) {
    payload.skills = (employee.skills ?? []).map((s) => toSkillPayload(s as any))
  }

  return payload
}

