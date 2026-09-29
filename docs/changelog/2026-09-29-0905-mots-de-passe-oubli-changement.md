# 2026-09-29 — Mot de passe oublié, changement de mot de passe (#68)

Seul le super admin pouvait réinitialiser un mot de passe, en générant un mot de
passe temporaire (`Math.random()`) affiché en clair dans un message flash. Aucun
utilisateur ne pouvait changer son mot de passe une fois connecté.

- **Mot de passe oublié.** `GET/POST /auth/forgot-password` (invités) envoie un
  lien `/auth/password-reset/:token`. La réponse est la même que le compte
  existe ou non, et un échec d'envoi n'est que journalisé (pas d'énumération).
  Nouvelle table `password_reset_tokens` (migration
  `1779900000000_create_password_reset_tokens_table`) : empreinte SHA-256 du
  secret comme pour l'onboarding (#65), valable 1 h, usage unique. Une nouvelle
  demande invalide le lien précédent.
- **Nouveau mot de passe.** La page `auth/ResetPassword` enregistre le mot de
  passe, invalide tous les liens du compte, envoie un e-mail de confirmation et
  renvoie vers la connexion (pas de connexion automatique). Un compte qui
  n'avait pas fini son onboarding le termine (le lien prouve l'accès à la
  boîte mail).
- **Changement une fois connecté.** `PUT /dashboard/password` (tous rôles) avec
  le mot de passe actuel. Formulaire `PasswordForm` dans les réglages
  conseiller/admin et sur le profil du candidat (pas sur la fiche vue par le
  conseiller). Un e-mail confirme le changement.
- **Super admin.** `POST /auth/reset-password/:id` envoie désormais un lien au
  titulaire au lieu d'afficher un mot de passe. `AuthService.resetPasswordForUser`
  et `AuthController.resetPassword` sont supprimés.
- **Limites.** `throttleForgotPassword` (5 / 15 min par IP),
  `throttlePasswordReset` (10/min par IP, GET et POST du lien),
  `throttleChangePassword` (5 / 15 min par compte).
- **Connexion.** Lien « Mot de passe oublié ? » et affichage du flash de succès.
- **Hors périmètre** (restent dans l'issue) : vérification du nouvel e-mail
  lors d'un changement d'adresse, retour au compte super admin après une
  prise d'identité, 2FA.
