# 2026-10-01 — B2C : organisation plateforme explicite et type de compte (#92)

Première brique de l'épic B2C (#90, `docs/epics/b2c.md`). Aucun changement visible : les
particuliers pourront s'inscrire seuls (#93) dans l'organisation plateforme, qui n'était
jusqu'ici reconnue que comme « l'organisation du super admin connecté ».

- **Base.** `organizations.is_platform` (faux par défaut, index unique partiel : une seule
  plateforme ; l'organisation seedée `ai-transition-carriere` est marquée par la migration) ;
  `employees.account_type` (`b2b` par défaut, `b2c`, CHECK SQL).
- **Code.** `PlatformOrganizationService` (`get()`, `getId()`, erreur 503
  `E_PLATFORM_ORGANIZATION_MISSING`) remplace `currentUser.organizationId` dans le back-office
  super admin (listes, création, relance, changement de rôle, suppression d'organisation).
  Constantes `#shared/constants/b2c` (`ACCOUNT_TYPES`, exercices gratuits Motivations et
  Valeurs), type `ResultsEntitlement`, helper pur `#shared/helpers/b2c_access` (accès,
  résultats, analyse IA, ordre des exercices, expurgation d'un résultat verrouillé).
  Prop partagée `user.accountType` pour les pages candidat.
- **Tests.** Acteurs `createPlatformOrganization`, `createB2cCandidate`, `createInHouseExpert` ;
  `createSuperAdmin()` rattache désormais à la plateforme. Specs service, modèle (unicité),
  seeder, middleware Inertia, constantes et helper.
