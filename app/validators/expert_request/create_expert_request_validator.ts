import {
  EXPERT_REQUEST_AVAILABILITY_MAX,
  EXPERT_REQUEST_MESSAGE_MAX,
} from '#shared/constants/expert_request'
import vine from '@vinejs/vine'

/** Demande d'accompagnement (#103) : un message obligatoire, des disponibilités optionnelles. */
export const createExpertRequestValidator = vine.create({
  message: vine.string().trim().minLength(10).maxLength(EXPERT_REQUEST_MESSAGE_MAX),
  availability: vine.string().trim().maxLength(EXPERT_REQUEST_AVAILABILITY_MAX).optional(),
})
