import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const EmployeeSynthesisFactory = factory
  .define(EmployeeSynthesis, ({ faker }) => {
    const shareStatus = faker.helpers.arrayElement([
      EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    ])

    return {
      organizationId: 0, // à surcharger
      employeeId: 0, // à surcharger
      shareStatus,
      sharedAt:
        shareStatus === EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
          ? DateTime.fromJSDate(faker.date.recent())
          : null,
      sharedByUserId: null, // à surcharger si besoin
      expertCommentsShared:
        shareStatus === EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED ? faker.lorem.paragraph() : null,
      expertNotesInternal: faker.lorem.paragraph(),
      executiveSummaryOverride: null,
    }
  })
  .build()
