# 2026-10-02 — B2C : vérification de l'adresse e-mail des particuliers (#98)

Épic #90, phase 1. Un particulier inscrit seul (#93) doit prouver son adresse
avant tout paiement (factures Stripe, liens de réinitialisation), sans que le
parcours gratuit (Motivations, Valeurs) soit bloqué.

- **Jetons.** `OnboardingToken` réutilisé (secret haché, expirant, usage
  unique) : `OnboardingTokensService.consumeForEmailVerification` pose
  `users.email_verified_at` et consomme le jeton sans toucher au mot de passe.
  L'activation B2B par lien (`consume`) vérifie désormais aussi l'adresse. Un
  seul lien actif par compte : chaque envoi invalide les précédents.
- **Envoi.** `EmailVerificationMailService.sendVerificationLink` (lien
  `/auth/verify-email/:token` bâti sur `APP_URL`, 7 jours) ;
  `EmailVerificationService.sendLinkSafely` part après le commit de
  `AuthService.registerCandidate` et n'annule jamais l'inscription en cas de
  panne du fournisseur (log + `reportError`).
- **Routes.** `GET /auth/verify-email/:token` (hors `guest`, `silentAuth`,
  `throttleOnboarding`) : flash succès ou erreur, retour sur
  `/dashboard/candidat`, `/dashboard` ou `/auth/login` selon la session.
  `POST /dashboard/candidat/email-verification/resend` (candidat connecté,
  avant même l'onboarding, nouveau `throttleEmailVerification` 5 / 15 min par
  compte) ; adresse déjà vérifiée → `EmailAlreadyVerifiedError` (409).
- **Paiement.** `EmailNotVerifiedError` (403, `E_EMAIL_NOT_VERIFIED`) ajoutée à
  `app/exceptions/billing_errors.ts`, levée par le checkout Stripe (#102).
- **Front.** Prop partagée `user.emailVerified` ; bandeau
  `EmailVerificationBanner` (tons `warning` du design system Duna × Ditto,
  bouton « Renvoyer le lien » en `useForm`) sur l'accueil candidat, rendu
  seulement pour un `b2c` non vérifié.
- **Tests.** Functional `auth/email_verification.spec.ts` (lien envoyé à
  l'inscription, valide / expiré / réutilisé / inconnu, invité ou connecté,
  renvoi, 409, quotas, rôles) ; unit services, mail, contrôleur, jetons ;
  integration middleware ; Vitest bandeau et accueil.
- **Docs.** `docs/MAIL.md` (tableau des e-mails transactionnels), `CLAUDE.md`.
