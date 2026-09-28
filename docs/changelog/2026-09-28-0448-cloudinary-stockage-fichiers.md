# 2026-09-28 — Cloudinary remplace Drive (fs/S3) pour les fichiers

Issue #49 : les exports PDF passent sur Cloudinary, seul stockage de fichiers
de l'application, comme dans boat-management. L'ancien système (Drive, disques
`fs` et `s3`, `storage/`, bucket R2) est retiré.

- **`config/cloudinary.ts`** et **`#services/cloudinary_service`** :
  `uploadBuffer`, `download` (URL signée 5 min, contenu relayé par le serveur),
  `destroy` ; dossiers `career-transition/{production|dev}/organizations/<orgId>/…`.
- **Fichiers privés** (`authenticated`) : aucune URL publique, téléchargement
  après contrôle d'accès. `public_id` sans nom de candidat.
- **`#services/pdf_storage_service`** garde son interface ; `pdfExportKey`
  prend l'organisation. Une ancienne clé `exports/…` est traitée comme absente
  (export à régénérer).
- **Env** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, requises en production (démarrage refusé sinon),
  optionnelles en dev et en test. `DRIVE_DISK` et `S3_*` supprimées des
  exemples d'env, de `render.yaml` et de `deploy/.env.example`.
- **Dépendances** : `cloudinary` ajouté ; `@adonisjs/drive`,
  `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` retirés.
- **Tests** : fake en mémoire `swapFakeCloudinary()`
  (`tests/support/fake_cloudinary.ts`) à la place de `drive.fake()` ; spec du
  service avec SDK stubé ; garde `tests/unit/hygiene/file_storage.spec.ts`.
- **CI** : le smoke du compose n'a plus de faux S3 (`rclone`) ; identifiants
  Cloudinary factices dans les jobs de production, aucun appel réseau.
- **RGPD** : Cloudinary ajouté à `SUBPROCESSORS` et à `docs/RGPD.md`.
- **Docs** : nouveau `docs/CLOUDINARY.md` ; DEPLOYMENT (stockage, variables,
  incidents), hosting, QUEUES, render-deployment, CLAUDE.md.
