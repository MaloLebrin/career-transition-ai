import Education from '#models/education'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const EducationFactory = factory
  .define(Education, ({ faker }) => {
    const start = DateTime.fromJSDate(faker.date.past({ years: 15 })).startOf('day')

    return {
      employeeId: 0, // à surcharger
      degree: faker.helpers.arrayElement(['Master', 'Licence', 'BTS', 'DUT', 'Doctorat']),
      school: faker.company.name(),
      startDate: start,
      endDate: start.plus({ years: 2 }),
      isCurrent: false,
      description: faker.lorem.sentence(),
      sortOrder: null,
    }
  })
  .build()
