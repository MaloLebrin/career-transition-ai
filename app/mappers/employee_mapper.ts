import type Employee from '#models/employee'
import type Skill from '#models/skill'
import type Experience from '#models/experience'
import type Education from '#models/education'
import type SupportPlanStep from '#models/support_plan_step'
import type ExerciseResult from '#models/exercise_result'
import type {
  EducationDto,
  EmployeeDto,
  ExperienceDto,
  ExerciseResultDto,
  SkillDto,
  SupportPlanStepDto,
} from '#dtos/employee_dto'

type ExerciseModelType = ExerciseResult['type']

const mapSkill = (skill: Skill): SkillDto => {
  const rawLevel = (skill as unknown as { $extras?: { level?: number } }).$extras?.level
  const level = Number(rawLevel ?? 3)
  const bounded = Number.isNaN(level) ? 3 : Math.min(5, Math.max(1, level))
  return {
    name: skill.name,
    level: bounded,
  }
}

const mapExperience = (experience: Experience): ExperienceDto => {
  const type = experience.type
  let mappedType: ExperienceDto['type'] | undefined

  switch (type) {
    case 'cdi':
      mappedType = 'CDI'
      break
    case 'cdd':
      mappedType = 'CDD'
      break
    case 'alternance':
      mappedType = 'Alternance'
      break
    case 'freelance':
    case 'independent':
      mappedType = 'Freelance'
      break
    default:
      mappedType = undefined
  }

  return {
    id: experience.id,
    title: experience.title,
    company: experience.company,
    type: mappedType,
    startDate: experience.startDate.toISODate()!,
    endDate: experience.endDate ? experience.endDate.toISODate()! : undefined,
    isCurrent: !!experience.isCurrent,
    description: experience.description ?? '',
  }
}

const mapEducation = (education: Education): EducationDto => {
  return {
    id: education.id,
    degree: education.degree,
    school: education.school,
    startDate: education.startDate.toISODate()!,
    endDate: education.endDate ? education.endDate.toISODate()! : undefined,
    isCurrent: education.isCurrent,
    description: education.description ?? '',
  }
}

export const exerciceTypeToFront = (type: ExerciseModelType): ExerciseResultDto['type'] => {
  switch (type) {
    case 'motivation':
      return 'MOTIVATION'
    case 'values':
      return 'VALUES'
    case 'personality':
      return 'PERSONALITY'
    case 'competencies':
      return 'COMPETENCIES'
    case 'life_curve':
      return 'LIFE_CURVE'
    case 'cv_analysis':
      return 'CV_ANALYSIS'
    case 'targeting':
      return 'TARGETING'
    case 'disc':
      return 'DISC'
    case 'circle_of_control':
      return 'CIRCLE_OF_CONTROL'
    case 'skill_mapping':
      return 'SKILL_MAPPING'
    default:
      return 'MOTIVATION'
  }
}

export const mapExerciseResult = (result: ExerciseResult): ExerciseResultDto => {
  return {
    id: result.id,
    type: exerciceTypeToFront(result.type),
    date: result.date ? result.date.toISO()! : new Date().toISOString(),
    duration: result.duration ?? 0,
    data: result.data,
    quantitativeScore: result.quantitativeScore ?? 0,
    qualitativeAnalysis: result.qualitativeAnalysis ?? undefined,
  }
}

export const mapSupportPlanStep = (step: SupportPlanStep): SupportPlanStepDto => {
  return {
    id: step.id,
    title: step.title ?? undefined,
    description: step.description ?? undefined,
    instructions: step.instructions ?? undefined,
    dueDate: step.dueDate ? step.dueDate.toISODate() || undefined : undefined,
    scheduledAt: step.scheduledAt ? step.scheduledAt.toISO() || undefined : undefined,
    endedAt: step.endedAt ? step.endedAt.toISO() || undefined : undefined,
    status: step.status,
    locationOrLink: step.locationOrLink ?? undefined,
    completed: step.completed,
    notes: step.notes ?? undefined,
    associatedExercise: step.associatedExercise
      ? exerciceTypeToFront(step.associatedExercise)
      : undefined,
    lastUpdated: step.updatedAt.toISO() || undefined,
    isLocked: step.isLocked,
    sortOrder: step.sortOrder ?? undefined,
  }
}

export const mapEmployee = (employee: Employee): EmployeeDto => {
  const experiences = (employee.experiences || []).map(mapExperience)
  const educations = (employee.educations || []).map(mapEducation)
  const skills = (employee.skills || []).map(mapSkill)
  const exercises = (employee.exerciseResults || []).map(mapExerciseResult)
  const steps = (employee.supportPlanSteps || []).map(mapSupportPlanStep)

  return {
    id: employee.id,
    organizationId: employee.organizationId,
    advisorId: employee.advisorId ?? undefined,
    name: employee.name,
    email: employee.email,
    currentRole: employee.currentRole,
    targetRole: employee.targetRole ?? undefined,
    skills,
    summary: employee.summary ?? undefined,
    advisorNotes: employee.advisorNotes ?? undefined,
    experiences,
    educations,
    status: employee.status as EmployeeDto['status'],
    onboarded: employee.onboarded,
    exercises,
    plan: steps,
  }
}
