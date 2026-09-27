import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import factory from '@adonisjs/lucid/factories'

export const SupportPlanStepExerciseFactory = factory
  .define(SupportPlanStepExercise, ({ faker }) => {
    return {
      supportPlanStepId: 0, // à surcharger
      exerciseType: faker.helpers.arrayElement(Object.values(EXERCICE_RESULTS_TYPES)),
      sortOrder: 0,
    }
  })
  .build()
