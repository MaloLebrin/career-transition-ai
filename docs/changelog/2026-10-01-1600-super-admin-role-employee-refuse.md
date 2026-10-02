# 2026-10-01 — Super admin : le rôle `employee` n'est plus créable ni attribuable (#96)

Le back-office super admin acceptait le rôle `employee` à la création d'un utilisateur et au
changement de rôle. Il créait alors un `User` sans fiche `Employee` : à la connexion,
`checkOnboarding` ne trouvait aucune fiche et renvoyait 401. Un candidat se crée par son
conseiller (invitation) ou, bientôt, par l'inscription en libre-service (#93).

- **Cause.** `SUPER_ADMIN_ASSIGNABLE_ROLES` (`shared/constants/roles.ts`) listait tous les rôles
  sauf `super_admin`, et alimentait les deux validators et les sélecteurs de l'interface.
- **Correctif.** Liste `SUPER_ADMIN_CREATABLE_ROLES` (`advisor`, `admin`, `expert`) utilisée par
  `create_platform_user_validator`, `update_user_role_validator`, `CreateUserModal` et le
  sélecteur de rôle de la liste des utilisateurs ; le serveur répond 422 sur `employee`.
- **Tests.** Non-régression functional (création et changement de rôle → erreur de validation
  `role`), validators, constantes, modale.
