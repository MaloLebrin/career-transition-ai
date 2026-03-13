import { BaseTransformer } from '@adonisjs/core/transformers'
import Employee from '#models/employee'

export default class EmployeeTransformer extends BaseTransformer<Employee> {
  toObject() {
    const serialized = this.resource.serialize()

    // Remove the automatically serialized relation nested objects to rename them
    delete serialized.exerciseResults
    delete serialized.supportPlanSteps
    delete serialized.skills
    delete serialized.experiences
    delete serialized.educations

    return {
      ...serialized,
      skills: this.resource.skills?.map((skill) => {
        const s = skill.serialize()
        return {
          ...s,
          level: skill.$extras.pivot_level,
        }
      }),
      exercises: this.resource.exerciseResults?.map((e) => e.serialize()),
      plan: this.resource.supportPlanSteps?.map((p) => p.serialize()),
      experiences: this.resource.experiences?.map((e) => e.serialize()),
      educations: this.resource.educations?.map((e) => e.serialize()),
    }
  }
}
