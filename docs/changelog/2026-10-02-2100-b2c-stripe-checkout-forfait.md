# 2026-10-02 — B2C : Stripe Checkout, démarrage du paiement et pages succès / annulation (#102)

Un particulier dont l'adresse e-mail est vérifiée règle le forfait via Stripe
Checkout hébergé (paiement unique) et revient débloqué, même sans webhook :
la page de succès relit la session chez Stripe. Aucun Stripe.js dans le bundle.

- **Configuration.** Dépendance `stripe`. Env `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET` (optionnelles au schéma, documentées dans les trois
  `.env*.example`). `config/stripe.ts` : en production, `STRIPE_ENABLED=true` sans
  clés (ou mal formées) empêche le démarrage (pattern `config/cloudinary.ts`).
- **Passerelle.** `app/services/billing/payment_gateway.ts` (interface, allowlist
  `mirror_tests`), `stripe_payment_gateway.ts` (`createCheckoutSession`,
  `retrieveCheckoutSession`, `constructWebhookEvent`) ; `checkoutParams` pur :
  `mode: payment`, `locale: fr`, `price_data` inline, `client_reference_id` et
  `metadata` avec ids seulement, `invoice_creation`, `success_url` à gabarit
  `{CHECKOUT_SESSION_ID}`. Fake de test `tests/support/fake_stripe.ts`
  (`swapFakeStripe` / `restoreStripe`, `pay(sessionId)`).
- **Services.** `CheckoutService.start` (paiement activé, compte B2C, e-mail vérifié,
  pas déjà payé → `candidate_payments` `pending` avec `withdrawal_waived_at`, session
  Stripe, URL), `reconcile` (session payée → `PaymentsService.markPaid`), `offerFor`.
  `PaymentsService.markPaid` idempotent (`WHERE status = 'pending'`) qui ouvre le
  droit via `EntitlementsService.unlockResults`. Erreurs `PaymentsDisabledError`
  (503), `PaymentGatewayNotConfiguredError` (503), `CheckoutSessionNotFoundError`
  (404), `InvalidStripeSignatureError` (400).
- **Contrôleur et routes.** `BillingController` (0 requête) : `GET /dashboard/candidat/offre`,
  `POST /dashboard/candidat/offre/checkout` (validator `acceptTerms` +
  `waiveWithdrawal`, redirection externe `inertia.location`),
  `GET /dashboard/candidat/billing/success?session_id=…`, `GET …/billing/cancel`.
- **Front (design system).** `pages/dashboard/candidat/billing/Offer.tsx`
  (bénéfices, prix TTC, version des CGV), `Success.tsx` (payé / en cours),
  `components/dashboard/b2c/CheckoutConsentForm.tsx` (`useForm`, cases CGV et
  renonciation, « Bientôt disponible » si `STRIPE_ENABLED` faux, rappel si e-mail non
  vérifié). `ResultsLockedCard` pointait déjà vers `/dashboard/candidat/offre`.
- **Tests.** Functional `candidat/billing_checkout.spec.ts` (offre, 404 B2B, checkout →
  pending + 409 `X-Inertia-Location`, validation, 403 non vérifié, 409 déjà payé,
  503 désactivé, success payé / impayé / inconnu, cancel) ; unit `checkout_service`,
  `payments_service`, `stripe_payment_gateway` (signature via
  `generateTestHeaderString`), `config/stripe`, `billing_controller`,
  `env_schema` (paiement désactivé dans les exemples de prod) ; Vitest
  `CheckoutConsentForm`, `Offer`, `Success`.
- **Docs.** Nouveau `docs/STRIPE.md` (lié depuis `docs/README.md`),
  `docs/PRODUCTION_CHECKLIST.md`, `docs/hosting.md`, `docs/DEPLOYMENT.md`,
  `docs/FEATURES.md`, `CLAUDE.md`. Nom et e-mail transmis à Stripe : sous-traitant
  déclaré par #95.
