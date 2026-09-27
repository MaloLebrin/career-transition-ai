import Note from '#models/note'
import { noteVisibilityValues } from '#shared/constants/note'
import factory from '@adonisjs/lucid/factories'

export const NoteFactory = factory
  .define(Note, ({ faker }) => {
    return {
      organizationId: 0, // à surcharger
      employeeId: 0, // à surcharger
      authorId: 0, // à surcharger
      supportPlanStepId: null,
      exerciseResultId: null,
      visibility: faker.helpers.arrayElement(noteVisibilityValues),
      content: faker.lorem.sentence(),
      deletedAt: null,
    }
  })
  .build()
