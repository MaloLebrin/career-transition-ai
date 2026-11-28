# 2026-11-28 — Changement d'e-mail : revenir à son adresse annule la demande en cours (#143)

Relevé en revue de la PR #182. Un utilisateur qui saisissait une nouvelle
adresse par erreur, puis remettait son adresse actuelle dans le formulaire de
profil, voyait « Profil mis à jour. » mais le premier lien restait valable : un
clic, même des jours plus tard, remplaçait l'adresse de connexion.

- **Cause.** `EmailVerificationService.requestEmailChange` renvoyait `null` pour
  une adresse inchangée avant d'invalider les liens `newEmail` en attente.
- **Correctif.** Une adresse inchangée annule la demande en cours
  (`cancelPendingEmailChanges`). À l'inverse, un renvoi du lien de vérification
  (`sendLink`) n'invalide plus que les liens sans `newEmail` : il n'annule plus
  en silence un changement que le profil affiche encore comme en attente.
- **Tests.** `email_verification_service.spec.ts` : retour à l'adresse actuelle
  (le premier lien devient invalide), renvoi de vérification qui conserve la
  demande de changement.
