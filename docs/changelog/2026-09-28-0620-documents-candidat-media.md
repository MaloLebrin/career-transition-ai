# 2026-09-28 — Documents candidat sur Cloudinary (table `media`)

Issue #50 : candidats et conseillers déposent, téléchargent et suppriment des
documents, stockés en privé sur Cloudinary. La table `files`, jamais branchée,
est remplacée par une table `media` polymorphe (comme dans boat-management).

- **Migrations** : `drop_files_table` (`down()` la recrée à l'identique) et
  `create_media_table` (`entity_type`/`entity_id`, `organization_id`, `kind`,
  `cloudinary_public_id` unique, `resource_type`, `delivery_type`,
  `original_filename`, `format`, `bytes`, `uploaded_by_id` ; CHECK synchronisés
  avec `shared/constants/media.ts`). Modèle `File` et relation `Employee.files`
  supprimés ; `shared/constants/file.ts` conservé pour la migration historique
  qui l'importe.
- **`#services/media_service`** : upload privé (`raw` + `authenticated`,
  `public_id` `…/employees/<id>/documents/doc_<uuid>.<ext>`, aucun nom),
  destruction compensatoire si l'insertion échoue, lectures scopées par
  organisation, `deleteAllForEntity` + `destroyFiles`.
- **`#services/candidate_documents_service`** : 30 documents par candidat,
  10 Mo, `pdf/doc/docx/jpg/jpeg/png/webp` ; le candidat ne supprime que ses
  propres dépôts ; autre organisation → 404.
- **Routes** : `POST|GET|DELETE /dashboard/candidat/documents[/:mediaId]` et
  `/dashboard/conseiller/employees/:id/documents[/:mediaId]`
  (`CandidateDocumentsController`, fin). Téléchargement relayé par le serveur,
  `Content-Disposition` UTF-8.
- **UI** : section « Documents » (`CandidateDocuments`) sur le profil
  (`dashboard/employee/profile/Home`), partagée par le candidat et le
  conseiller.
- **CV importé conservé** : après une extraction IA réussie, le CV d'un
  candidat devient un document `cv` ; un échec de stockage ne fait pas échouer
  l'import (Sentry). Mention ajoutée à l'étape d'onboarding.
- **RGPD** : `candidate:export` liste les documents dans `donnees.json` et les
  inclut dans `documents/` ; `candidate:purge` supprime les lignes `media` dans
  la transaction puis les fichiers Cloudinary (`filesDeleted` compte PDF et
  documents). `RETENTION_PERIODS`, finalité Cloudinary et `docs/RGPD.md` à jour.
- **Seeder** `MediaSeeder` : un CV de démonstration si `CLOUDINARY_*` est
  renseigné. Factory `MediaFactory`.
- **Docs** : `docs/CLOUDINARY.md`, `docs/RGPD.md`, `docs/FEATURES.md`,
  `CLAUDE.md`.
