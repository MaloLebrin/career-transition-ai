import vine from '@vinejs/vine'

/**
 * Consentements requis avant la redirection vers Stripe (#102) : acceptation
 * des CGV et renonciation expresse au droit de rétractation (art. L221-28 13°).
 * `accepted` : `on`, `1`, `true`, `yes`.
 */
export const checkoutValidator = vine.create({
  acceptTerms: vine.accepted(),
  waiveWithdrawal: vine.accepted(),
})
