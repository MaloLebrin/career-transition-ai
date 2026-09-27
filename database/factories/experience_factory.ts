import Experience from '#models/experience'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const ExperienceFactory = factory
  .define(Experience, ({ faker }) => {
    const start = DateTime.fromJSDate(faker.date.past({ years: 15 })).startOf('day')

    return {
      employeeId: 0, // à surcharger
      title: faker.person.jobTitle(),
      company: faker.company.name(),
      type: faker.helpers.arrayElement(Object.values(EXPERIENCES_TYPES)),
      startDate: start,
      endDate: start.plus({ years: 1 }),
      isCurrent: false,
      description: faker.lorem.sentence(),
      sortOrder: null,
    }
  })
  .build()
