# 2026-10-03 — RGPD : paiements et demandes d'accompagnement dans l'export et la purge (#106)

Les tables de l'épic B2C (`candidate_payments` #94, `expert_requests` #103)
sont couvertes par le droit d'accès et le droit à l'effacement, en respectant
la conservation comptable des paiements.

- **Export** (`candidateDataSnapshot`, libre-service `/dashboard/candidat/data/export`
  et `node ace candidate:export`) : `payments[]` (déjà là, #94) et désormais
  `expertRequests[]` (statut, message, disponibilités, motif de refus, dates) ;
  `loadCandidateForExport` précharge la relation.
- **Purge** (`previewCandidatePurge` / `purgeCandidate`, `node ace candidate:purge`) :
  `CandidatePurgeSummary.expertRequests` (supprimées en cascade avec la fiche) et
  `paymentsAnonymized` (paiements **conservés** 10 ans comme pièces comptables : les FK
  `employee_id` / `user_id` passent à `NULL`, aucun champ identifiant n'y est stocké).
  La commande affiche les deux compteurs. Les notifications du parcours B2C portent toutes
  `meta.employeeId` : elles sont déjà supprimées par `notificationsAbout`.
- **Tests** : unit `candidate_data_service.spec.ts` (export des demandes ; purge d'un
  particulier : demande supprimée, paiement conservé sans `employee_id` ni `user_id`,
  compteurs ; sortie de la commande) ; functional `candidat/data_rights.spec.ts` (export d'un
  particulier avec paiement et demande).
- **Docs** : `docs/RGPD.md` §4 (contenu de l'export) et §5 (paiements anonymisés,
  notifications de l'équipe).
