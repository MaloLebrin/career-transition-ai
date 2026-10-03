import { REVOKE_REASON_MAX } from '#shared/constants/billing'
import vine from '@vinejs/vine'

/** Révocation d'un accès au forfait (#107) : motif obligatoire, consigné sur le paiement. */
export const revokePaymentValidator = vine.create({
  reason: vine.string().trim().minLength(3).maxLength(REVOKE_REASON_MAX),
})
