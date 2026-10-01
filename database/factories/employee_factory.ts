import Employee from '#models/employee'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import factory from '@adonisjs/lucid/factories'

export const EmployeeFactory = factory
  .define(Employee, ({ faker }) => {
    return {
      organizationId: 0, // à surcharger
      advisorId: null, // à surcharger si besoin
      userId: null,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      currentRole: faker.person.jobTitle(),
      targetRole: faker.person.jobTitle(),
      summary: faker.lorem.paragraph(),
      advisorNotes: null,
      status: faker.helpers.arrayElement(['active', 'completed', 'on-hold']) as
        | 'active'
        | 'completed'
        | 'on-hold',
      onboarded: faker.datatype.boolean(),
      accountType: ACCOUNT_TYPES.B2B,
    }
  })
  .build()
