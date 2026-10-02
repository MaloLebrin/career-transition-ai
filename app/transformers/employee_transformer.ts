import { BaseTransformer } from '@adonisjs/core/transformers'
import Employee from '#models/employee'
import { exerciceTypeToFront } from '#mappers/employee_mapper'

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
      plan: this.resource.supportPlanSteps?.map((p) => {
        const step = p.serialize()
        const exercises = (p.exercises ?? []) as Array<{ exerciseType: any }>

        // The frontend expects `associatedExercises` (mapped types), not the raw `exercises` relation.
        if (exercises.length > 0) {
          step.associatedExercises = exercises.map((e) => exerciceTypeToFront(e.exerciseType))
        } else {
          step.associatedExercises = undefined
        }

        return step
      }),
      experiences: this.resource.experiences?.map((e) => e.serialize()),
      educations: this.resource.educations?.map((e) => e.serialize()),
    }
  }
}

/**
 * Objet brut de la fiche candidat, pour les contrôleurs qui doivent le relire
 * avant envoi (expurgation des résultats réservés au forfait, #101) :
 * `EmployeeTransformer.transform()` renvoie un `Item` paresseux, sérialisé
 * seulement par Inertia. Destiné aux pages du candidat : les notes du conseiller
 * (`advisorNotes`) en sont retirées, elles restent réservées à l'équipe
 * (`EmployeeTransformer.transform`).
 */
export function employeeToObject(employee: Employee) {
  const { advisorNotes: _advisorNotes, ...candidateView } = new EmployeeTransformer(
    employee
  ).toObject() as ReturnType<EmployeeTransformer['toObject']> & { advisorNotes?: unknown }
  return candidateView
}
