# 2026-10-03 — B2C : back-office des demandes d'accompagnement et équipe interne (#105)

Les super admins traitent les demandes des particuliers (#103) : ils assignent
un expert interne ou refusent avec un motif, et gèrent l'équipe interne.

- **Équipe interne.** `PLATFORM_TEAM_ROLES` (`advisor`, `expert`, `admin` — jamais
  `employee` #96 ni `super_admin` #66) ; `PlatformTeamService` : `listMembers()` (membres
  de l'organisation plateforme et nombre de particuliers suivis), `findEligibleExpert`,
  `invite()` via `SuperAdminUsersService.createUserWithInvite` dont l'interdiction sur
  l'organisation plateforme est levée par `allowPlatformOrganization` (le rôle `employee`
  reste refusé par le validator).
- **Assignation et refus.** `ExpertRequestsService.assign(actor, { requestId, expertUserId })`
  (404 inconnue, 409 déjà traitée, 422 hors équipe interne ; transaction `employees.advisor_id`
  - statut `accepted`, `handled_by_user_id`, `assigned_expert_user_id`, `handled_at`),
    `decline(actor, { requestId, reason })`, `listForAdmin()`. Erreurs
    `ExpertRequestNotFoundError`, `ExpertRequestNotPendingError`, `ExpertNotEligibleError`.
    Notifications `expert_assigned` (candidat, « Votre expert : X »), `candidate_assigned`
    (expert, id du candidat seulement, lien vers sa fiche), `expert_request_declined` (candidat,
    motif) : migration CHECK, sujets d'e-mail, icône `NotificationItem`.
- **Routes et contrôleur.** `GET/POST /dashboard/super-admin/expert-requests[/:id/assign|decline]`,
  `GET/POST /dashboard/super-admin/team` — `SuperAdminExpertRequestsController` sans requête,
  validators `assignExpertValidator`, `declineExpertRequestValidator`,
  `invitePlatformMemberValidator`.
- **Front (design system).** Pages `dashboard/admin/expert_requests/Index.tsx` (filtre par
  statut, `ExpertRequestRow` + `AssignExpertForm` + refus motivé) et `dashboard/admin/team/Index.tsx`
  (`InvitePlatformMemberForm`, tableau) ; liens « Demandes d'accompagnement » et « Équipe
  interne » dans la barre latérale super admin.
- **Effet.** L'expert interne (rôle `advisor` de la plateforme) voit le particulier dans
  `/dashboard/conseiller` et peut créer étapes et notes ; l'accueil B2C affiche « Votre expert : X ».
- **Tests.** Functional `admin/expert_requests.spec.ts`, `admin/team.spec.ts`,
  `conseiller/home.spec.ts` (expert interne), `access/role_matrix.spec.ts` ; unit
  `platform_team_service`, `expert_requests_service` (assign / decline / listForAdmin),
  `super_admin_users_service`, `candidate_notifications_service`, contrôleur ; Vitest pages,
  composants, constantes, `NotificationItem`.
- **Docs.** `docs/FEATURES.md` § 7.3 et § 11.3, `docs/MANUAL_TESTS.md` § 7.3, `CLAUDE.md`.
