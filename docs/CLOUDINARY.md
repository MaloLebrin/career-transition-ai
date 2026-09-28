# Stockage des fichiers — Cloudinary

Cloudinary est le **seul** stockage de fichiers de l'application (issue #49),
en dev comme en production. Il n'y a ni disque local, ni volume, ni bucket
S3 : web et worker lisent et écrivent le même compte.

Fichiers stockés : les exports PDF des synthèses, le logo d'organisation (#51)
et les documents candidat (#50, table `media`).

## Code

| Élément                                   | Rôle                                                                                                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/cloudinary.ts`                    | Configure le SDK depuis `CLOUDINARY_*`. En production, le démarrage échoue s'il en manque une ; ailleurs l'app démarre et seul un appel au stockage échoue (503).                                                                   |
| `#services/cloudinary_service`            | `uploadBuffer`, `uploadFile` (fichier multipart), `download` (flux relayé), `destroy` ; `CloudinaryFolders`. Seul point d'accès au SDK.                                                                                             |
| `#services/pdf_storage_service`           | Exports PDF : `pdfExportKey`, `storePdf`, `readPdfStream`, `deletePdf`, purge à 30 jours. Résout `CloudinaryService` via le conteneur à chaque appel (fake en test).                                                                |
| `#services/branding_service`              | Logo : `uploadLogo` (nouveau `public_id` à chaque envoi, ancien détruit après l'enregistrement, nouveau détruit si l'enregistrement échoue), `deleteLogo`.                                                                          |
| `#services/media_service`                 | Table `media` (polymorphe `entity_type` + `entity_id`, `organization_id` pour le scoping) : `upload` (destruction compensatoire si l'insertion échoue), `list`, `get`, `download`, `delete`, `deleteAllForEntity` + `destroyFiles`. |
| `#services/candidate_documents_service`   | Documents d'un candidat (30 max) : fiche résolue par rôle, droit de suppression, `storeImportedCv` (CV de l'import IA, best effort).                                                                                                |
| `app/exceptions/storage_errors.ts`        | `CloudinaryNotConfiguredError` (503), `CloudinaryDownloadError` (502). Pannes, donc hors `ignoreCodes` : elles remontent dans Sentry.                                                                                               |
| `tests/support/fake_cloudinary.ts`        | `swapFakeCloudinary()` / `restoreCloudinary()` : stockage en mémoire, journal `uploaded` / `downloaded` / `destroyed`. Aucun appel réseau en test ni en CI.                                                                         |
| `tests/unit/hygiene/file_storage.spec.ts` | Échoue si `@adonisjs/drive`, `@aws-sdk/*`, `DRIVE_DISK` ou `S3_*` réapparaissent.                                                                                                                                                   |

## Arborescence

```
career-transition/
  production/ | dev/            ← app.inProduction
    organizations/<orgId>/
      exports/pdf_export_<id>.pdf
      logo/logo_<uuid>          ← image publique
      employees/<employeeId>/documents/doc_<uuid>.<ext>
```

Les `public_id` sont dérivés d'**ids**, jamais d'un nom ni d'un slug : aucune
donnée personnelle dans Cloudinary en dehors du contenu des fichiers. Le nom
affiché reste en base (`pdf_exports.file_name`, `media.original_filename`). Un même compte peut servir
à la production et au dev sans mélange.

## Accès privé

Les fichiers candidat sont envoyés en `type: 'authenticated'` : leur URL
Cloudinary n'est pas lisible sans signature. Au téléchargement, le serveur
contrôle l'accès (`PdfExportDownloadsController`, `CandidateDocumentsController`), signe une URL de 5 minutes
(`private_download_url`), relaie le contenu et ne transmet jamais cette URL au
navigateur.

Seul le logo d'organisation est public (`type: 'upload'`, `resource_type:
'image'`) : il est affiché par `<img>` depuis `organizations.logo_url`. Pour
que ces pages n'envoient pas leur URL complète à Cloudinary, toutes les
réponses portent `Referrer-Policy: strict-origin-when-cross-origin`
(`#middleware/security_headers_middleware`).

## Suppression

- Purge nocturne (`PurgeExpiredPdfExportsJob`) : PDF de plus de 30 jours.
- Effacement d'un candidat (`node ace candidate:purge <id>`) : ses PDF et ses
  documents, après la transaction en base (les lignes `media` sont supprimées
  dans la transaction : pas de clé étrangère vers l'entité).
- Document : à sa suppression par le candidat (ses propres dépôts) ou par un
  conseiller du cabinet.
- Logo : l'ancien fichier au remplacement, le fichier à la suppression
  (`organizations.logo_public_id`). Un échec de suppression est signalé à
  Sentry sans annuler l'action.
- `destroy` invalide le cache CDN (`invalidate: true`).

## Mise en place

Voir [DEPLOYMENT.md § Stockage des fichiers](DEPLOYMENT.md#stockage-des-fichiers-cloudinary).
Région : États-Unis par défaut, UE sur offre payante (issue #24) ;
sous-traitant déclaré dans `SUBPROCESSORS` (`shared/constants/legal.ts`).
