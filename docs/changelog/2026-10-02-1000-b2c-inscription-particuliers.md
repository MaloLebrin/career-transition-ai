# 2026-10-02 — B2C : inscription des particuliers sur `/inscription` (#93)

Troisième brique de l'épic B2C (#90) : un particulier crée seul son compte candidat, sans
cabinet ni invitation, puis suit l'onboarding candidat existant. Sans effet en production tant
que `B2C_REGISTRATION_ENABLED` reste `false` (défaut).

- **Flag.** `B2C_REGISTRATION_ENABLED` (`config/registration.ts` → `candidateEnabled`, défaut
  `!inProduction`, indépendant de `REGISTRATION_ENABLED`) ; `registrationOpen({ kind: 'candidate' })`
  ferme la page (redirection + message) et le `POST` (403) ; prop partagée `b2cRegistrationEnabled`
  qui affiche ou masque « Créer mon compte » sur la connexion.
- **Routes.** `GET /inscription` (`guest()`) et `POST /auth/register/candidat` (quota
  `throttleRegister` partagé avec l'inscription conseiller : 3 par heure et par IP).
- **Service.** `AuthService.registerCandidate` : e-mail unique sur toute la plateforme, compte
  `employee` + fiche `b2c` (`advisor_id` nul, `onboarded: false`, statut `onboarding`) dans
  l'organisation plateforme (`PlatformOrganizationService`, 503 si absente), en transaction ;
  rôle et organisation jamais lus du payload.
- **Base.** `users.terms_accepted_at`, `users.terms_version` (preuve d'acceptation des CGU,
  `TERMS_VERSION`) et `users.email_verified_at` (posée par #98), nullables.
- **Front.** `RegisterCandidatePage` (`useForm`, erreurs serveur par champ, case CGU obligatoire
  avec liens `/cgu` et `/confidentialite` en nouvel onglet, mot de passe ≥ 8) ; lien particulier
  sur la connexion ; wording d'onboarding neutre quand aucun conseiller n'accompagne.
- **Tests.** Functional (nominal, redirection vers l'onboarding, CGU, validation, doublon, 503,
  quota, flag fermé, page connexion), unit (service, middleware, validator, env), integration
  (props partagées), Vitest (page, composant, connexion).
