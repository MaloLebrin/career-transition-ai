# 2026-11-28 — Équipe plateforme : documents, exports PDF et notes bornés aux particuliers assignés (#167)

Dans l'organisation plateforme, un conseiller ou un expert ne doit voir que les
particuliers qui lui sont assignés (`teamEmployeeScope`, revue PR #109). Trois
services ne filtraient que par organisation : par énumération d'ids, un expert
atteignait les documents, les synthèses PDF et la création de note des
particuliers suivis par un autre expert.

- **Cause.** `CandidateDocumentsService.employeeFor`,
  `PdfExportDownloadsService.findFor` (rôles conseiller) et
  `NotesService.getEmployeeForNewNote` lisaient la fiche (ou l'export) avec
  `where('organizationId', …)` seul.
- **Correctif.** Les trois lectures passent par `teamEmployeeScope(user)` ; pour
  les exports, `whereIn('employeeId', …)` sur les fiches du périmètre. Hors
  périmètre → 404 (jamais 403). L'admin de la plateforme et les cabinets B2B
  gardent leur portée (toute l'organisation). Un export demandé par un expert
  devient introuvable pour lui si le particulier est réassigné.
- **Modification et suppression de note.** `NotesService.getEditableNote` lit
  la note de l'auteur sur une fiche de son périmètre : la note d'un particulier
  réassigné n'est plus modifiable par l'ancien expert, et la note d'un collègue
  répond 404 (au lieu de 403, qui en confirmait l'existence).
- **Audit.** Les autres `Employee.query()` de `app/services` filtrés par
  `organizationId` résolvent la fiche du candidat connecté (`userId`), comptent
  des licences ou relèvent du super admin / des commandes ace : aucun autre trou.
- **Garde d'hygiène.** `tests/unit/hygiene/team_employee_scope.spec.ts` : dans
  `app/services` et `app/controllers`, toute lecture `Employee.query(…)`
  (transaction comprise) filtrée sur l'id (`'id'`, `'employees.id'`,
  `whereIn`, `where({ id })`) applique `teamEmployeeScope`, et tout
  `Employee.find*` compte ; exceptions justifiées dans une liste blanche à
  compteurs, qu'on ne relève jamais.
- **Tests.** Non-régression functional
  (`tests/functional/conseiller/platform_team_resources_scope.spec.ts` : expert
  A, particulier assigné à l'expert B → 404 sur la liste, le téléchargement, le
  dépôt et la suppression de documents, le téléchargement PDF et la création de
  note ; l'expert assigné garde l'accès) et unitaires des trois services.
