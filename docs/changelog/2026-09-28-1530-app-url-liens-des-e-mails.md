# 2026-09-28 — Liens des e-mails construits depuis `APP_URL` (#64)

Les liens d'onboarding et d'invitation étaient construits avec
`${request.protocol()}://${request.hostname()}`. Avec `trustProxy: () => true`,
`X-Forwarded-Host` est fourni par le client : une requête forgée faisait partir chez
un vrai utilisateur (candidat, collaborateur, propriétaire d'organisation) un lien
de création de mot de passe vers un domaine piégé.

- **`APP_URL`** (obligatoire, `start/env_schema.ts`) : URL publique de l'application.
  Ajoutée à `.env.example`, `.env.test`, `.env.production.example` et aux trois blocs
  d'env de la CI. Le compose de production la pose depuis `APP_DOMAIN`
  (`https://${APP_DOMAIN}`) : rien à ajouter dans `deploy/.env`.
- **`appUrl(path)`** (`#utils/app_url`) : seule base des liens envoyés par e-mail
  (`OnboardingMailService`). Le paramètre `baseUrl` disparaît des services
  (candidats, collaborateurs, super admin) et des contrôleurs. `EmployeesService.create`
  prend `{ sendInvite: true }` à la place.
- **Tests.** Functional `tests/functional/security/email_links.spec.ts` : les cinq
  points d'envoi, avec `X-Forwarded-Host: evil.test`, n'envoient que des liens
  `APP_URL` ; unit `appUrl`.
- **À faire au déploiement** : hors compose, définir `APP_URL` (ex.
  `https://app.example.fr`) — sans elle, l'application ne démarre plus.
