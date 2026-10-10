import { CHECKOUT_PAYMENT_STATUSES } from '#shared/constants/billing'

/**
 * Lectures pures d'une session Stripe Checkout (#139), partagées entre la
 * passerelle (session typée) et le webhook (objet brut).
 */

/**
 * Session réglée : `paid`, ou `no_payment_required` quand un code promo à
 * 100 % ramène le total à 0 (aucun PaymentIntent n'est alors créé).
 */
export function isCheckoutSettled(paymentStatus: unknown): boolean {
  return (
    paymentStatus === CHECKOUT_PAYMENT_STATUSES.PAID ||
    paymentStatus === CHECKOUT_PAYMENT_STATUSES.NO_PAYMENT_REQUIRED
  )
}

/** Stripe renvoie tantôt un id, tantôt l'objet développé (`{ id }`) ; `null` sinon. */
export function stripeIdOf(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return null
}

/** Nombre fini, ou `null` (champ absent ou malformé d'un événement). */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export interface CheckoutAmounts {
  amountSubtotal?: number | null
  amountTotal?: number | null
  amountDiscount?: number | null
}

/**
 * Remise appliquée, en centimes : `total_details.amount_discount` quand Stripe
 * le transmet, sinon l'écart entre sous-total et total, sinon 0.
 */
export function checkoutDiscountCents(amounts: CheckoutAmounts): number {
  if (typeof amounts.amountDiscount === 'number') return Math.max(amounts.amountDiscount, 0)
  if (typeof amounts.amountSubtotal === 'number' && typeof amounts.amountTotal === 'number') {
    return Math.max(amounts.amountSubtotal - amounts.amountTotal, 0)
  }
  return 0
}
