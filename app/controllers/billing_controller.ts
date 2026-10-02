import { CheckoutService } from '#services/billing/checkout_service'
import { BILLING_PATHS } from '#shared/constants/billing'
import { checkoutSuccessValidator } from '#validators/billing/checkout_success_validator'
import { checkoutValidator } from '#validators/billing/checkout_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export const PAYMENT_SUCCESS_MESSAGE = 'Paiement confirmé : vos résultats sont débloqués.'
export const PAYMENT_CANCELED_MESSAGE =
  'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.'
export const MISSING_SESSION_MESSAGE = 'Session de paiement introuvable.'

/**
 * Forfait particuliers (#102) : page de l'offre, départ vers Stripe Checkout,
 * retour succès / annulation. Toute la logique est dans `CheckoutService`.
 */
@inject()
export default class BillingController {
  constructor(private checkoutService: CheckoutService) {}

  /** GET /dashboard/candidat/offre */
  public async offer({ auth, inertia }: HttpContext) {
    return inertia.render('dashboard/candidat/billing/Offer', {
      offer: await this.checkoutService.offerFor(auth.getUserOrFail()),
    })
  }

  /** POST /dashboard/candidat/offre/checkout → redirection externe vers Stripe. */
  public async checkout({ auth, request, inertia }: HttpContext) {
    await request.validateUsing(checkoutValidator)
    const { url } = await this.checkoutService.start(auth.getUserOrFail())
    return inertia.location(url)
  }

  /** GET /dashboard/candidat/billing/success?session_id=… */
  public async success({ auth, request, inertia, response, session }: HttpContext) {
    const { session_id: sessionId } = await request.validateUsing(checkoutSuccessValidator)
    if (!sessionId) {
      session.flash('error', MISSING_SESSION_MESSAGE)
      return response.redirect(BILLING_PATHS.offer)
    }

    const result = await this.checkoutService.reconcile(auth.getUserOrFail(), sessionId)
    // La page explique elle-même l'attente ; seul le succès mérite un flash.
    if (result.paid) session.flash('success', PAYMENT_SUCCESS_MESSAGE)
    return inertia.render('dashboard/candidat/billing/Success', { paid: result.paid })
  }

  /** GET /dashboard/candidat/billing/cancel */
  public async cancel({ response, session }: HttpContext) {
    session.flash('error', PAYMENT_CANCELED_MESSAGE)
    return response.redirect(BILLING_PATHS.offer)
  }
}
