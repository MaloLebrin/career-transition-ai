import SupportPlanStep from '#models/support_plan_step'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import factory from '@adonisjs/lucid/factories'

export const SupportPlanStepFactory = factory
  .define(SupportPlanStep, ({ faker }) => {
    return {
      employeeId: 0, // à surcharger
      advisorId: null, // à surcharger si besoin
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      instructions: null,
      dueDate: null,
      scheduledAt: null,
      endedAt: null,
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: null,
      completed: false,
      notes: null,
      sortOrder: 0,
      isLocked: false,
    }
  })
  .build()
