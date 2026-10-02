import { EXPERT_REQUEST_DECLINE_REASON_MAX } from '#shared/constants/expert_request'
import vine from '@vinejs/vine'

/** Refus motivé d'une demande (#105) : le motif est transmis au candidat. */
export const declineExpertRequestValidator = vine.create({
  reason: vine.string().trim().minLength(3).maxLength(EXPERT_REQUEST_DECLINE_REASON_MAX),
})
