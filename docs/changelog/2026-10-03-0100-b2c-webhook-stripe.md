# 2026-10-03 — B2C : webhook Stripe idempotent, déblocage et remboursement (#104)

Le webhook devient la source de vérité des paiements du forfait (#102) : il
confirme, refuse, annule ou rembourse côté serveur, de façon idempotente, et
déclenche ce que le paiement débloque.

- **Données.** Migration `stripe_events` (`stripe_event_id` unique, `type`,
  `livemode`, `processed_at`, **sans payload**) ; migration CHECK `notifications`
  (`results_unlocked`, `results_access_revoked`). Modèle `StripeEvent` + factory.
- **Domaine.** `shared/constants/billing.ts` : `STRIPE_WEBHOOK_PATH`,
  `STRIPE_WEBHOOK_EVENTS` (les cinq événements à abonner), `WEBHOOK_OUTCOMES`,
  `STRIPE_REFUND_REVOKE_REASON` ; type `WebhookHandleResult`.
  `PaymentsService` : `findById`, `findByPaymentIntent`, `markFailed`, `markCanceled`,
  `refund` (`paid` → `refunded`, `refunded_at` + `revoked_at`, puis
  `EntitlementsService.revokeResults`) — toutes idempotentes par `WHERE status`.
  `EntitlementsService.onResultsUnlocked` : un `AnalyzeExerciseQualitativeJob` par
  exercice complété sans analyse, puis notification `results_unlocked` ;
  `onResultsRevoked` : `results_access_revoked` (remboursement Stripe comme révocation
  manuelle). `CandidateNotificationsService.resultsUnlocked` / `resultsAccessRevoked`
  (particuliers seulement), sujets d'e-mail, icônes `NotificationItem`.
- **Webhook.** `StripeWebhooksService.handle(rawBody, signature)` : signature vérifiée
  par la passerelle, réservation de l'événement dans `stripe_events` (déjà traité →
  aucun effet ; ligne sans `processed_at` → reprise), routage par type, paiement
  retrouvé par `client_reference_id` puis id de session (remboursement : par
  `payment_intent`), `processed_at` en fin de traitement, `reportError` (ids seulement)
  et 500 en cas d'échec pour que Stripe rejoue. `StripeWebhooksController`
  (`request.raw()` + `stripe-signature`, `200 { received: true }`), route
  `POST /webhooks/stripe` hors `guest`/`auth`, `csrf.exceptRoutes` dans `config/shield.ts`.
- **Tests.** Functional `webhooks/stripe.spec.ts` (400 signature, paiement + jobs IA +
  notification, rejeu, webhook puis réconciliation, échec/expiration, remboursement →
  téléchargement PDF 404, type inconnu / paiement inconnu, reprise d'une livraison
  interrompue) ; unit `stripe_webhooks_service`, `payments_service`, `entitlements_service`,
  `candidate_notifications_service`, contrôleur, `config/shield` ; Vitest constantes et
  `NotificationItem`.
- **Docs.** `docs/STRIPE.md` (section Webhook : événements, idempotence, déblocage,
  `stripe trigger`), `docs/QUEUES.md`, `docs/AI_JOBS.md`, `docs/FEATURES.md` § 11.4, `CLAUDE.md`.
