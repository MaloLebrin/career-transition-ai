# 2026-09-28 — Jetons d'onboarding hachés, consultation limitée (#65)

`onboarding_tokens.token` contenait le secret du lien d'onboarding en clair : une
fuite de la base, d'une sauvegarde ou d'un log SQL donnait des liens utilisables
pour choisir le mot de passe de comptes non activés. `GET /onboarding/:token`, qui
indique aussi si un jeton existe, n'était pas limité.

- **Empreinte seulement.** `OnboardingToken.createForUser` stocke
  `sha256(secret)` ; le secret n'existe que sur l'instance renvoyée
  (`plainToken`, non persisté) et part dans l'e-mail. `OnboardingMailService`
  refuse un jeton sans secret. La création d'organisation par le super admin
  passe aussi par `createForUser` (option `client` pour la transaction).
- **Migration** `1779800000000_hash_onboarding_tokens` : les jetons existants sont
  hachés sur place, les liens déjà envoyés restent valides. `down()` invalide les
  jetons en attente (une empreinte ne se réinverse pas).
- **Contrôleur fin.** `OnboardingTokensService` (`findByPlainToken`, `consume` en
  transaction) ; plus de requête Lucid dans `OnboardingController` (ligne de base
  de `controllers_thin.spec.ts` retirée).
- **Limite.** `throttleOnboarding` (10/min par IP) couvre maintenant GET et POST,
  avec un quota commun.
- **Tests.** Unit modèle et service (empreinte stockée ≠ secret, l'empreinte ne
  retrouve rien), functional (11ᵉ GET → 429, quota GET/POST partagé, liens des
  e-mails comparés par empreinte), factory au même format.
