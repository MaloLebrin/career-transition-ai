# 2026-10-01 — B2C : domaine « droits d'accès » et table `candidate_payments` (#94)

Deuxième brique de l'épic B2C (#90) : la donnée et le service qui répondent à « ce candidat
a-t-il payé ? », **sans Stripe**. Aucun écran modifié ; base du verrouillage des résultats
(#101), du checkout (#102) et de l'octroi manuel par le super admin (#107).

- **Base.** Table `candidate_payments` (produit, fournisseur `stripe` / `manual`, statut, montant,
  devise, références Stripe, `paid_at`, `refunded_at`, `revoked_at` + motif, `granted_by_user_id`,
  `withdrawal_waived_at`) ; CHECK SQL depuis `#shared/constants/billing` ; `employee_id` et
  `user_id` en **SET NULL** : la pièce comptable survit anonymisée à la purge RGPD (10 ans).
- **Code.** `EntitlementsService` (`hasResultsAccess`, `forEmployee` — B2B toujours ouvert —,
  `forUser`, `grantManual`, `revoke`, points d'extension `onResultsUnlocked` /
  `onResultsRevoked` pour le webhook #104) ; erreurs `E_RESULTS_LOCKED` (403),
  `E_PAYMENT_NOT_FOUND` (404), `E_ENTITLEMENT_ALREADY_GRANTED` (409) ; `config/billing.ts`
  (`STRIPE_ENABLED` faux par défaut, `B2C_RESULTS_PRICE_CENTS`) ; prop partagée `entitlement`
  et hook `useEntitlement` ; export RGPD avec `payments`.
- **Démo.** `B2cCandidateSeeder` (expert interne, particulier gratuit, particulier au forfait) ;
  acteur de test `createB2cCandidate({ paid: true })`.
- **Tests.** Service (droits, octroi, révocation), modèle (états, CHECK, SET NULL), seeder,
  middleware Inertia, export RGPD, hook, constantes.
