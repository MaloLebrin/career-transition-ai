# 2026-10-06 — Codes promo Stripe sur le forfait particuliers (#139)

Un particulier peut régler le forfait avec un code promo (pourcentage, montant
fixe ou 100 %, avec expiration et plafond d'utilisations). Les codes sont créés
et gérés dans le tableau de bord Stripe et saisis sur la page Stripe Checkout :
aucune table, aucun champ ni flag côté application.

- **Comportement.** Session Checkout créée avec `allow_promotion_codes`. La
  réconciliation et le webhook relisent la remise (`amount_subtotal`,
  `amount_total`, `total_details.amount_discount`, `discounts[].promotion_code`).
  Un code à 100 % (`payment_status = no_payment_required`, sans PaymentIntent)
  vaut réglé (`isCheckoutSettled`). Le libellé du code est relu chez Stripe au
  mieux (`PromotionCodesService.labelFor`) : une panne est signalée et ne bloque
  jamais le déblocage.
- **Recoupement.** Le prix catalogue annoncé par Stripe (`amount_subtotal`) est
  comparé à `amount_cents + discount_cents` (`CandidatePayment.grossAmountCents`),
  invariant valable avant comme après règlement — y compris quand le webhook
  rejoue après la page de succès. Sans sous-total, repli sur `amount_total`.
- **Données.** `candidate_payments` : `discount_cents` (CHECK ≥ 0), `promo_code`,
  `stripe_promotion_code_id` ; `amount_cents` devient le montant réellement
  encaissé, écrit dans la même mise à jour idempotente `pending → paid`. Le CA du
  mois du back-office reflète donc les montants perçus. Factory : états
  `discounted` et `free`.
- **Admin et RGPD.** Liste des paiements : code et remise sous le montant
  (« Gratuit · code … » à 0 €). Export RGPD du candidat complété.
- **UI.** Page Offre : « Un code promo ? Saisissez-le à l'étape de paiement
  sécurisé. » quand le paiement est activé.
- **Garantie « une fois par compte ».** Stripe ne peut l'imposer (client créé à
  chaque session) ; l'application le fait déjà (un seul droit actif, 409 sinon).
- **Tests.** Unit (passerelle `sessionView`, `PaymentsService`, `CheckoutService`,
  `StripeWebhooksService`, `PromotionCodesService`), functional (succès remisé et
  gratuit, webhook `no_payment_required`), Inertia (formulaire, tableau admin,
  helper, constantes), stats et export.
- **Docs.** `docs/STRIPE.md` § Codes promo et Recoupement, `docs/MANUAL_TESTS.md`
  § 11.3, `docs/FEATURES.md`, `CLAUDE.md`.
