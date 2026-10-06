import { describe, expect, test } from 'vitest'
import {
  BILLING_ADMIN_PATHS,
  BILLING_CURRENCY,
  CHECKOUT_PAYMENT_STATUSES,
  DEFAULT_RESULTS_PRICE_CENTS,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_WEBHOOK_PATH,
  WEBHOOK_OUTCOMES,
  checkoutPaymentStatusValues,
  paymentProductValues,
  paymentProviderValues,
  paymentStatusValues,
  stripeWebhookEventValues,
} from '#shared/constants/billing'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/billing (#94)', () => {
  test('produits : enum cohérent et figé (CHECK candidate_payments.product_code)', () => {
    expectConsistentEnum(PAYMENT_PRODUCTS, paymentProductValues, ['results_access'])
  })

  test('fournisseurs : enum cohérent et figé (CHECK candidate_payments.provider)', () => {
    expectConsistentEnum(PAYMENT_PROVIDERS, paymentProviderValues, ['stripe', 'manual'])
  })

  test('statuts : enum cohérent et figé (CHECK candidate_payments.status)', () => {
    expectConsistentEnum(PAYMENT_STATUSES, paymentStatusValues, [
      'pending',
      'paid',
      'failed',
      'canceled',
      'refunded',
    ])
  })

  test('statuts de session Checkout (#139) : enum cohérent et figé (valeurs Stripe)', () => {
    expectConsistentEnum(CHECKOUT_PAYMENT_STATUSES, checkoutPaymentStatusValues, [
      'paid',
      'unpaid',
      'no_payment_required',
    ])
  })

  test('chaque statut a un libellé français non vide', () => {
    expect(Object.keys(PAYMENT_STATUS_LABELS).sort()).toEqual([...paymentStatusValues].sort())
    for (const label of Object.values(PAYMENT_STATUS_LABELS)) {
      expect(label.trim()).not.toBe('')
    }
  })

  test('devise ISO 4217 en minuscules (format Stripe) et prix par défaut entier positif', () => {
    expect(BILLING_CURRENCY).toMatch(/^[a-z]{3}$/)
    expect(Number.isInteger(DEFAULT_RESULTS_PRICE_CENTS)).toBe(true)
    expect(DEFAULT_RESULTS_PRICE_CENTS).toBeGreaterThan(0)
  })

  test('webhook (#104) : chemin public, cinq événements Stripe à abonner, issues figées', () => {
    expect(STRIPE_WEBHOOK_PATH).toBe('/webhooks/stripe')
    // Noms imposés par Stripe (points) : hors du contrat `expectConsistentEnum`.
    expect(stripeWebhookEventValues).toEqual([
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed',
      'checkout.session.expired',
      'charge.refunded',
    ])
    expect(Object.values(STRIPE_WEBHOOK_EVENTS)).toEqual(stripeWebhookEventValues)
    expect(Object.values(WEBHOOK_OUTCOMES)).toEqual([
      'processed',
      'duplicate',
      'ignored',
      'unmatched',
    ])
  })

  test('back-office (#107) : chemins super admin des particuliers et des paiements', () => {
    expect(BILLING_ADMIN_PATHS.b2c).toBe('/dashboard/super-admin/b2c')
    expect(BILLING_ADMIN_PATHS.payments).toBe('/dashboard/super-admin/payments')
    expect(BILLING_ADMIN_PATHS.grant(4)).toBe('/dashboard/super-admin/b2c/4/entitlement/grant')
    expect(BILLING_ADMIN_PATHS.revoke(9)).toBe('/dashboard/super-admin/payments/9/revoke')
  })
})
