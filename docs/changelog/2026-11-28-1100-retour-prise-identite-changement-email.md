# 2026-11-28 — Retour au compte super admin et confirmation du nouvel e-mail (#143)

Reste de #68. Après une prise d'identité, le super admin devait se reconnecter
pour retrouver son compte ; et un conseiller ou un admin qui changeait d'adresse
la voyait remplacée sans aucune vérification.

- **Prise d'identité.** `POST /auth/impersonate/:id` garde l'id du super admin en
  session (`IMPERSONATOR_SESSION_KEY`, `#services/impersonation_service`). La prop
  partagée `impersonation` alimente le bandeau `ImpersonationBanner` (dans
  `DashboardLayout`) et son bouton « Revenir à mon compte »
  (`POST /auth/impersonation/leave`, `auth()` seul). Compte d'origine supprimé,
  désactivé ou rétrogradé → déconnexion. La déconnexion clôt aussi la prise
  d'identité. Refusé : un autre super admin (pas d'imbrication), un compte
  désactivé, soi-même (`ImpersonationNotAllowedError`).
- **Changement d'e-mail.** `PUT /dashboard/conseiller/profile` met le nom à jour
  tout de suite ; une nouvelle adresse reçoit un lien
  (`EmailVerificationService.requestEmailChange`, jeton `OnboardingToken` avec
  `new_email`, 7 jours) et ne remplace l'actuelle qu'au clic sur
  `/auth/verify-email/:token`. L'ancienne adresse reçoit ensuite un avis. Une
  seule demande en cours (la dernière l'emporte), unicité vérifiée sans tenir
  compte de la casse à la demande et au clic (`EmailChangeConflictError`). Les
  réglages affichent l'adresse en attente (`pendingEmail`).
- **Sécurité.** Un lien de changement d'e-mail ne vaut jamais lien d'onboarding
  (`OnboardingTokensService.findForOnboarding`) : son destinataire ne peut pas
  choisir le mot de passe du compte.
- **Décision.** L'e-mail reste non modifiable depuis le profil candidat (PR #87) :
  il est aussi l'identifiant du client Stripe et la copie `employees.email` que
  lit le conseiller. Le mécanisme suit déjà la fiche si on l'ouvre plus tard.
- **Migration.** `onboarding_tokens.new_email` (nullable).
- **Tests.** Unit (`impersonation_service`, `email_verification_service`,
  `onboarding_tokens_service`, `auth_service`, contrôleurs), functional
  (`super_admin_actions`, `conseiller/profile`), Vitest (`ImpersonationBanner`,
  `ProfileForm`).
