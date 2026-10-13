# 2026-10-13 — Listes paginées avec recherche côté serveur (#75)

Les listes de candidats, d'organisations, d'utilisateurs et d'exports PDF étaient chargées en
entier (avec, pour les candidats, tous leurs exercices, expériences et compétences), et la
recherche se faisait dans le navigateur. L'export PDF était coupé en dur à 100 lignes.

- **Candidats (conseiller).** `EmployeesService.listForTeam` : 25 par page, tri par nom, recherche
  nom / e-mail et filtre de statut en base. Seul le plan d'accompagnement est préchargé (la liste
  n'affiche que la progression). Le périmètre (`teamEmployeeScope`) est inchangé.
- **Organisations et utilisateurs (super admin).** `SuperAdminOrganizationsService.list`
  (compteurs par `withCount`, propriétaire calculé pour la page, recherche nom / slug / id, seuil
  de candidats) et `SuperAdminUsersService.list` (recherche nom / e-mail / cabinet, filtre de rôle).
  Les contrôleurs n'ont plus de requête Lucid pour ces listes (lignes de base de
  `controllers_thin` abaissées).
- **Exports PDF.** `PdfExportsService.listForUser` pagine au lieu de couper à 100 ; la page garde
  le filtre de statut en changeant de page et n'ajoute un export reçu en direct qu'en première page.
- **Socle.** `LIST_PAGE_SIZE`, `parseListParams`, `listQuery`, `#utils/pagination` (méta, `ILIKE`
  avec `%` `_` `\` échappés), hook `useServerList` (recherche différée de 300 ms, navigation
  Inertia partielle, URL partageable) ; `EmployeesTable` reçoit `hasFilters` à la place du
  nombre total.
- **Hors périmètre.** Les notifications n'ont pas de page de liste : la cloche en charge 20 au
  plus. La liste des organisations proposée dans la modale de création d'utilisateur reste
  complète (sélecteur).
- **Tests.** Unit (utilitaire, trois services, exports PDF, contrôleurs), functional des trois
  routes (page, recherche, filtre, entrées invalides, isolation par conseiller), Vitest (helpers,
  hook, quatre pages).
