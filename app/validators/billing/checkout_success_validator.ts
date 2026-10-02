import vine from '@vinejs/vine'

/**
 * Retour de Stripe Checkout (#102) : `?session_id=cs_…`. Absent → le contrôleur
 * renvoie à l'offre ; présent mais mal formé → rejeté avant tout appel à Stripe.
 */
export const checkoutSuccessValidator = vine.create({
  session_id: vine
    .string()
    .trim()
    .maxLength(255)
    .regex(/^cs_[A-Za-z0-9_]+$/)
    .optional(),
})
