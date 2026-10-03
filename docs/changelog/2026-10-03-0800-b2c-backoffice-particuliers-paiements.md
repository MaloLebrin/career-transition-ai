# 2026-10-03 — B2C : back-office des particuliers et des paiements (#107)

Le super admin voit les particuliers (toujours exclus des listes
« Organisations » et « Utilisateurs ») et dispose des outils de support :
octroi manuel d'un accès, retrait d'un accès, suivi des paiements, indicateurs.

- **Services.** `SuperAdminB2cService` : `listCandidates()` (B2C de l'organisation
  plateforme, droit ouvert, paiement actif, expert, demande en attente, e-mail vérifié),
  `stats()` (inscrits, forfaits réglés distincts non révoqués, chiffre d'affaires Stripe du
  mois civil, demandes en attente), `homeStats()` (compteurs de l'accueil, migrés depuis le
  contrôleur : ligne de base `controllers_thin` 8 → 6). `SuperAdminPaymentsService` :
  `parseFilter`, `list({ status, page })` paginée (`PAYMENTS_PAGE_SIZE`), `grant` (particulier
  de la plateforme seulement, 404 sinon → `EntitlementsService.grantManual`), `revoke`
  (→ `EntitlementsService.revoke`, motif + auteur consignés).
- **Routes et contrôleur.** `GET /dashboard/super-admin/b2c`, `POST …/b2c/:employeeId/entitlement/grant`,
  `GET /dashboard/super-admin/payments?status=&page=`, `POST …/payments/:id/revoke`
  (`revokePaymentValidator`) — `SuperAdminBillingController` sans requête. Constantes
  `BILLING_ADMIN_PATHS`, `PAYMENTS_PAGE_SIZE`, `REVOKE_REASON_MAX` ; types `shared/types/billing/admin.ts`.
- **Front (design system).** Pages `dashboard/admin/b2c/Index.tsx` (StatCards + `B2cCandidatesTable`
  avec `ConfirmModal` d'octroi) et `dashboard/admin/payments/Index.tsx` (filtre `SelectField`,
  pagination, `PaymentsTable` + `RevokePaymentForm`) ; accueil super admin migré aux tokens
  (cliquet `inertia/pages` 448 → 445) avec un bloc « Particuliers (B2C) » ; liens
  « Particuliers » et « Paiements » dans la barre latérale.
- **Tests.** Functional `admin/b2c.spec.ts` (liste + indicateurs, grant → paiement manuel,
  jobs IA, notification ; 409 / 404 ; 403), `admin/payments.spec.ts` (liste, filtre, revoke,
  validation, 404, 403), `admin/home.spec.ts`, `access/role_matrix.spec.ts` ; unit services et
  contrôleur ; Vitest pages, composants, accueil, constantes.
- **Docs.** `docs/FEATURES.md` § 7.4 et § 11.6, `docs/MANUAL_TESTS.md` § 7.4, `docs/STRIPE.md`
  (support), `CLAUDE.md`.
