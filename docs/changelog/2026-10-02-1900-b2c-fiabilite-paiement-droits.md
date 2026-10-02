# 2026-10-02 — B2C : fiabilité du paiement et des droits (revue PR #109)

- **Webhook.** `charge.refunded` partiel ignoré (droit conservé) ; remboursement
  après révocation manuelle sans écrasement de la date ni du motif ; recoupement
  session / montant / devise (écart → `unmatched` + `reportError`).
- **Effets rejouables.** Colonnes `unlock_effects_at` / `revoke_effects_at` :
  un webhook repris sur un paiement déjà `paid` / `refunded` rejoue les effets
  non aboutis, une seule fois. Notification au mieux, sans 500 pour l'admin.
- **Checkout.** Réutilisation du `pending` à session ouverte, `failed` si Stripe
  échoue, `throttleCheckout` (10/h par compte), `reconcile` renvoie `paid=false`
  pour un paiement non payé ou révoqué.
- **Un seul droit actif.** Index unique partiel + octroi manuel atomique
  (`FOR UPDATE`) ; paiement en doublon conservé révoqué et signalé.
- **Traçabilité.** `revoked_by_user_id` (FK users, SET NULL), motif sans
  suffixe, export RGPD complété (`revokeReason`, `withdrawalWaivedAt`),
  `PaymentRow.revokedBy`.
- **Technique.** `listCandidates` sans N+1 (une requête sur les paiements) ;
  `EntitlementsService` en `@inject()` (`PdfExportDownloadsService` et
  `ExerciseResultsService` aussi) ; helpers de test `tests/support/entitlements.ts`.
- Migrations `1780100000010` et `1780100000011` (down implémentés),
  `database/schema.ts` régénéré. Voir `docs/STRIPE.md`, « Fiabilité des droits ».
- **Tests du webhook.** HTTP 500 sur erreur interne (Stripe retente, reprise en
  200), `payment_status: unpaid` (paiement resté `pending`), ordre inversé
  (`expired` après `paid` sans effet ; `charge.refunded` avant `completed` :
  `unmatched`, le paiement s'ouvre ensuite), `client_reference_id` incohérent.
  Correctif : `expired` / `async_payment_failed` dont `client_reference_id`
  visait le paiement d'une autre session le touchaient ; ils sont recoupés par
  l'id de session (`unmatched` sinon). Helper `fakeStripeEvent`.
- **Pagination des particuliers.** `SuperAdminB2cService.listCandidates(page)` →
  `{ items, page, total, lastPage }` (`ADMIN_LIST_PAGE_SIZE`, partagée avec les
  paiements), `parsePage`, requêtes constantes d'une page à l'autre. Composant
  `ui/Pagination` extrait de la page des paiements et utilisé par les deux pages
  (`router.get`, `preserveScroll`, `only`).
- **Révocation.** `PaymentsTable` affiche `revokedBy` (« Retiré par … ») à côté
  du motif.
