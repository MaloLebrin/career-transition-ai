# 2026-09-28 — Super admin : changement de rôle borné (#66)

`POST /dashboard/super-admin/users/:id/role` validait le rôle avec un validator
inline qui acceptait **tous** les rôles, y compris `super_admin`, et chargeait la
cible sans borne (`User.find`) : un super admin pouvait promouvoir n'importe quel
compte super admin, se rétrograder lui-même ou modifier un compte de la plateforme.

- **Validator.** `updateUserRoleValidator`
  (`app/validators/super_admin/update_user_role_validator.ts`) n'accepte que les
  rôles attribuables, `SUPER_ADMIN_ASSIGNABLE_ROLES` (`#shared/constants/roles`),
  partagés avec la création d'utilisateur et le formulaire côté front.
- **Service.** `SuperAdminUsersService.updateRole` : compte inexistant ou de
  l'organisation plateforme (dont soi-même) → `SuperAdminUserNotFoundError` (404) ;
  autre super admin → `SuperAdminRoleLockedError` (422). Erreurs dans
  `app/exceptions/super_admin_user_errors.ts`, codes ajoutés à `ignoreCodes`.
- **Interface.** La page `/dashboard/super-admin/users` ne propose plus
  `super_admin` et n'affiche pas de sélecteur sur la ligne d'un super admin.
- **Tests.** Functional (promotion refusée, soi-même, compte plateforme, autre
  super admin), unit (service, validator), Vitest (options du sélecteur).
