# 2026-10-13 — Gestion de l'équipe du cabinet (#71)

Le bouton « Retirer l'accès » ne faisait rien, les rôles étaient incohérents et les licences
n'étaient contrôlées que dans le navigateur.

- **Gestion d'un membre (admin seulement).** `PUT …/organization/members/:id/role`,
  `POST …/disable`, `…/enable`, `…/reassign` (`OrganizationTeamController`, `TeamMembersService`).
  Retirer l'accès = désactivation (`users.disabled_at`, #73) : connexion refusée, session coupée,
  données conservées, réversible. Soi-même et le dernier administrateur actif sont protégés
  (`TeamMemberLockedError`, 422) ; un membre d'un autre cabinet → 404.
- **Réassignation.** Confie tous les candidats d'un membre à un autre membre actif du cabinet.
- **Rôles alignés sur `USERS_ROLES`.** Un cabinet n'a que `admin` et `advisor`
  (`ORGANIZATION_TEAM_ROLES`) ; `consultant` disparaît (validator, DTO, modale), `expert` reste
  réservé à l'équipe plateforme. L'invitation enregistre le rôle demandé, le DTO l'expose tel quel
  (plus de « Inconnu »), la liste inclut les experts, et le propriétaire créé à l'inscription
  publique est `admin` (et non `advisor`).
- **Licences côté serveur.** `MAX_LICENSES_ADVISORS` (comptes admin / conseiller non désactivés,
  réactivation comprise) et `MAX_LICENSES_CANDIDATES` (fiches non archivées) sont vérifiés dans les
  services avec `AdvisorLicenseLimitReachedError` / `CandidateLicenseLimitReachedError` (409).
  L'organisation plateforme n'est pas limitée. Le compteur du front reste indicatif.
- **Erreurs.** `team_errors.ts` ; l'invitation d'un e-mail déjà pris lève `EmailAlreadyUsedException`
  (le `try/catch` du contrôleur disparaît).
- **Hors périmètre.** Le champ `advisorId` du validator employé n'est pas ouvert : la réassignation
  passe par l'équipe, réservée à l'admin.
- **Tests.** Functional `conseiller/team` et `settings`, unit `TeamMembersService`,
  `OrganizationTeamController`, `AdvisorService`, `EmployeesService`, Vitest `TeamMember`,
  mapper et constantes.
