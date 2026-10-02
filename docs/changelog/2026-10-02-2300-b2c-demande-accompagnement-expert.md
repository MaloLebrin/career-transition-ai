# 2026-10-02 — B2C : demande d'accompagnement par un expert, côté candidat (#103)

Un particulier dont le forfait est réglé demande à être accompagné ; les super
admins sont notifiés et assigneront un expert (#105). Les `contact_requests`
publics (anonymes) ne convenaient pas : nouveau modèle lié à la fiche candidat.

- **Données.** Migration `expert_requests` (`employee_id` CASCADE, `organization_id`
  RESTRICT, `message`, `availability`, `status` CHECK `pending` / `accepted` /
  `declined` / `closed`, `handled_by_user_id` et `assigned_expert_user_id` SET NULL,
  `handled_at`, `decline_reason`, index unique partiel « une seule demande `pending`
  par candidat ») ; migration CHECK `notifications` (`expert_request_created`).
  Modèle `ExpertRequest`, factory (états), seeder (une demande en attente pour le
  particulier au forfait de démo), relation `Employee.expertRequests`.
- **Domaine.** `shared/constants/expert_request.ts` (statuts, libellés, longueurs,
  motifs de verrou, routes), `shared/types/expert_request/`, erreurs
  `ExpertRequestNotAvailableError` (B2B, 403), `ExpertRequestRequiresPaymentError`
  (non payé, 403), `ExpertRequestAlreadyPendingError` (409).
  `ExpertRequestsService` : `supportViewFor(user)`, `createForUser(user, input)`,
  `listForEmployee`. `CandidateNotificationsService.expertRequested` prévient chaque
  super admin (id du candidat, `expertRequestId`, lien `/dashboard/super-admin/expert-requests`),
  jamais le nom ; sujet d'e-mail et icône `NotificationItem`.
- **Routes et contrôleur.** `GET /dashboard/candidat/accompagnement`,
  `POST /dashboard/candidat/expert-requests` (validator `message` 10–2000, `availability`
  ≤ 500) — `ExpertRequestsController` sans requête.
- **Front (design system).** Page `dashboard/candidat/expert/Index.tsx` (verrou B2B,
  `ResultsLockedCard` non payé, carte expert assigné, `ExpertRequestStatus`,
  `ExpertRequestForm`), CTA « Demander un accompagnement » sur l'accueil B2C (payé sans
  expert) et lien « Être accompagné par un expert » sur la synthèse d'un particulier.
- **Tests.** Functional `candidat/expert_requests.spec.ts` (page selon le cas, dépôt +
  notification, 409, nouvelle demande après refus, 403 non payé / B2B / conseiller,
  validation) et `access/role_matrix.spec.ts` ; unit service, contrôleur, notifications,
  seeder ; Vitest formulaire, statut, page, accueil B2C, synthèse, `NotificationItem`,
  constantes.
- **RGPD.** Nouvelle donnée : message libre du candidat, supprimé en cascade avec la
  fiche (`docs/RGPD.md` §3 et §5, `RETENTION_PERIODS`).
