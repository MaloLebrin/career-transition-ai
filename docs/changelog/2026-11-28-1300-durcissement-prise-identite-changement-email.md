# 2026-11-28 — Prise d'identité et changement d'e-mail : corrections de revue (#143)

Suite de #161, après revue de code. Une clé de prise d'identité restée en
session (déconnexion forcée d'un compte désactivé) permettait à la personne qui
se connectait ensuite sur ce navigateur de rouvrir le compte du super admin.

- **Prise d'identité.** La session garde `{ impersonatorId, targetId }`, honoré
  seulement sur la session du compte pris (`ImpersonationService.resolveImpersonator`
  et `bannerFor` reçoivent l'utilisateur connecté). La clé est retirée à toute
  ouverture de session (connexion, inscriptions, onboarding) et à la déconnexion
  forcée d'un compte désactivé (`AuthMiddleware`).
- **Quota.** `PUT /dashboard/conseiller/profile` passe par
  `throttleEmailVerification` (5 / 15 min par compte) : une nouvelle adresse
  reçoit un e-mail à chaque demande.
- **Échec d'envoi.** Si le lien ne part pas, la demande est annulée (jeton
  invalidé, aucune « confirmation en attente ») et `EmailChangeLinkNotSentError`
  (503) est remontée à l'utilisateur ; l'erreur part dans Sentry.
- **Concurrence.** Au clic, un verrou transactionnel (`pg_advisory_xact_lock`) sur
  l'adresse sérialise deux confirmations vers la même adresse : la contrainte
  d'unicité en base n'est que par organisation.
- **Casse.** La nouvelle adresse est enregistrée en minuscules ; la connexion
  retrouve aussi un compte sans tenir compte de la casse quand un seul correspond.
- **Injection.** `OrganizationsController` reçoit `EmailVerificationService` sans option.
- **Tests.** Régressions functional (clé orpheline d'un autre compte, déconnexion
  forcée, connexion), quota, échec d'envoi, adresse en minuscules, connexion sans casse.
