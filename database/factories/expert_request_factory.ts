import ExpertRequest from '#models/expert_request'
import { EXPERT_REQUEST_STATUSES } from '#shared/constants/expert_request'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/** Par défaut : demande `pending`. États `accepted`, `declined`, `closed`. */
export const ExpertRequestFactory = factory
  .define(ExpertRequest, ({ faker }) => {
    return {
      employeeId: 0, // à surcharger
      organizationId: 0, // à surcharger
      message: faker.lorem.sentences(2),
      availability: 'Les mardis et jeudis en fin de journée',
      status: EXPERT_REQUEST_STATUSES.PENDING,
      handledByUserId: null as number | null,
      assignedExpertUserId: null as number | null,
      handledAt: null as DateTime | null,
      declineReason: null as string | null,
    }
  })
  .state('accepted', (request) => {
    request.status = EXPERT_REQUEST_STATUSES.ACCEPTED
    request.handledAt = DateTime.now().minus({ days: 1 })
  })
  .state('declined', (request) => {
    request.status = EXPERT_REQUEST_STATUSES.DECLINED
    request.handledAt = DateTime.now().minus({ days: 1 })
    request.declineReason = 'Aucun expert disponible pour le moment'
  })
  .state('closed', (request) => {
    request.status = EXPERT_REQUEST_STATUSES.CLOSED
    request.handledAt = DateTime.now().minus({ days: 10 })
  })
  .build()
