# 2026-09-28 — Réglages du cabinet : modifications réservées aux administrateurs (#61)

Les routes de mutation du cabinet (`PUT /dashboard/conseiller/settings/organization`,
`POST …/organization/advisors`, `POST|DELETE …/organization/logo`) n'étaient protégées
que par `advisorOrAdmin()` : un conseiller ou un expert pouvait renommer le cabinet,
changer son logo ou inviter un collaborateur — y compris avec le rôle `admin`.

- **Routes.** Le groupe `/organization` porte désormais `middleware.admin()` ; la page
  `GET /dashboard/conseiller/settings` reste accessible aux conseillers et experts.
- **Interface.** `GeneralInfoForm` et `VisualIdentity` prennent une prop `readOnly` :
  pour un non-admin, champs désactivés, pas de bouton d'envoi ni d'action sur le logo,
  et un message indiquant que seul un administrateur peut modifier le cabinet.
- **Tests.** Functional : conseiller et expert reçoivent un 403 sur chaque mutation
  (infos, invitation, logo) et gardent l'accès en lecture ; Vitest : mode lecture seule
  des trois composants.
