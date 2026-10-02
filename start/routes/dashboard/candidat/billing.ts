import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const BillingController = () => import('#controllers/billing_controller')

/**
 * Forfait particuliers (#102) : offre, départ vers Stripe Checkout, retours.
 * Réservé aux candidats onboardés ; le service refuse les comptes B2B (404).
 */
router
  .group(() => {
    router.get('/offre', [BillingController, 'offer']).as('candidat.billing.offer')
    router.post('/offre/checkout', [BillingController, 'checkout']).as('candidat.billing.checkout')
    router.get('/billing/success', [BillingController, 'success']).as('candidat.billing.success')
    router.get('/billing/cancel', [BillingController, 'cancel']).as('candidat.billing.cancel')
  })
  .use([middleware.auth(), middleware.candidate(), middleware.checkOnboarding()])
  .prefix('/dashboard/candidat')
