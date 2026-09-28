# 2026-09-28 — Téléchargement d'export PDF : lecture bornée et 404 hors de portée (#63)

`GET /dashboard/pdf-exports/:id/download` chargeait l'export sans borne d'organisation
(`PdfExport.findOrFail`), puis répondait 400 s'il n'était pas terminé — avant tout
contrôle d'accès — et 403 s'il appartenait à une autre organisation. Ces réponses
permettaient de sonder les exports des autres cabinets (existence et statut).

- **Correctif.** `PdfExportDownloadsService` (`#services/pdf_export_downloads_service`)
  borne la lecture dans la requête : super admin → tous ; conseiller, expert, admin →
  son organisation ; candidat → ses demandes ou celles de sa fiche. Hors de portée ou
  inexistant → `PdfExportNotFoundError` (404) ; le statut n'est examiné qu'ensuite
  (`PdfExportNotReadyError`, 409) ; fichier absent du stockage → 404.
- **Expert.** Un expert tombait dans la branche « candidat » et ne pouvait pas
  télécharger les exports de son organisation, pourtant listés sur
  `/dashboard/conseiller/pdf-exports` : il est désormais traité comme un conseiller.
- **Contrôleur fin.** Plus de requête Lucid ni de contrôle de rôle dans
  `PdfExportDownloadsController` (ligne de base de `controllers_thin.spec.ts` retirée) ;
  erreurs de domaine dans `app/exceptions/pdf_export_errors.ts` (codes ajoutés à
  `ignoreCodes`) ; `:id` contraint à un nombre (`router.matchers.number()`).
- **Tests.** Functional (`tests/functional/access/pdf_export_download.spec.ts`) : 404
  pour une autre organisation et pour l'export d'un autre candidat, 404 avant 409 sur un
  export non terminé, accès expert ; unit : service (portée, statut, fichier) et
  contrôleur (délégation, en-têtes).
