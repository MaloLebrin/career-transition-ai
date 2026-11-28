# 2026-11-28 — Unicité globale des e-mails de compte (#169)

L'unicité des adresses de compte n'était garantie que par organisation
(`unique(organization_id, email)`), alors que la connexion et le mot de passe
oublié cherchent un compte sur toute la base. Un cabinet pouvait donc inviter une
adresse déjà utilisée par un autre cabinet ou par un particulier : selon le cas,
l'un des deux comptes ne pouvait plus se connecter, ou le lien de
réinitialisation partait vers le mauvais compte.

- **Base.** Nouvelle migration `1791000000007_make_users_email_globally_unique` :
  index unique `users_email_lower_unique` sur `users (lower(email))`, retrait de
  la contrainte composite et de l'index non unique `users_email_lower_index`
  devenu redondant (`down()` les rétablit). Elle échoue avec un message clair
  (ids des comptes concernés) s'il existe des doublons, sans dédoublonner :
  requête de détection dans `docs/PRODUCTION_CHECKLIST.md`.
- **Contrôle partagé.** `#services/user_email_service` (`assertAvailable`,
  `isTaken`, `findByEmail`) : global et insensible à la casse, utilisé par
  l'inscription (cabinet et particulier), l'invitation d'un conseiller, la
  création d'utilisateur et d'organisation par le super admin, la création et
  l'invitation d'une fiche candidat, le profil candidat et le changement
  d'e-mail confirmé par lien. `EmailAlreadyUsedException` (409) étend
  désormais `DomainException`.
- **Fiche candidat.** L'invitation ne réutilise un compte existant que s'il
  s'agit d'un compte candidat du même cabinet ; sinon elle est refusée (409)
  au lieu de créer un doublon (la recherche était sensible à la casse).
- **Connexion / mot de passe oublié.** `findForLogin` et
  `PasswordsService.requestReset` lisent l'unique compte de l'adresse, sans
  heuristique « un seul compte correspond ».
- **Tests.** Adresse d'une autre organisation ou de casse différente refusée
  (conseiller, super admin, fiche candidat), tests unitaires du contrôle
  partagé et de l'index ; les tests qui créaient des doublons inter-organisations
  sont retirés (état désormais impossible).
