import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import { reportError } from '#services/error_tracking_service'
import { inject } from '@adonisjs/core'

/**
 * Libellé d'un code promo Stripe (#139). Le webhook et la session ne portent
 * que l'id `promo_…` ; le libellé (« BIENVENUE20 ») est relu chez Stripe pour
 * le back-office. **Au mieux** : une panne est signalée (`reportError`, id
 * seulement) et renvoie `null`, sans jamais bloquer le déblocage — l'id reste
 * enregistré sur le paiement.
 */
@inject()
export class PromotionCodesService {
  constructor(private gateway: StripePaymentGateway) {}

  public async labelFor(promotionCodeId: string | null | undefined): Promise<string | null> {
    if (!promotionCodeId) return null
    try {
      const promotion = await this.gateway.retrievePromotionCode(promotionCodeId)
      return promotion?.code ?? null
    } catch (error) {
      reportError(error, {
        tags: { feature: 'stripe_payment', step: 'promotion_code_label' },
        extra: { promotionCodeId },
      })
      return null
    }
  }
}
