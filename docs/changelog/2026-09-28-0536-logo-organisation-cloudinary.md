# 2026-09-28 — Logo d'organisation sur Cloudinary

Issue #51 : la carte « Identité visuelle » des réglages du cabinet est
réactivée. Un admin ou un conseiller uploade, remplace et supprime le logo de
son organisation.

- **Routes** : `POST` / `DELETE /dashboard/conseiller/settings/organization/logo`
  (`auth` + `advisorOrAdmin`), `OrganizationLogosController` (fin,
  `redirect().back()`), toujours sur l'organisation de l'utilisateur connecté.
- **`#services/branding_service`** : image **publique** dans
  `…/organizations/<id>/logo/logo_<uuid>` ; l'ancien fichier est détruit après
  l'enregistrement ; si l'enregistrement échoue, le nouvel upload est détruit
  (aucun orphelin). Échec de suppression : signalé à Sentry, sans annuler
  l'action.
- **`CloudinaryService.uploadFile`** : envoi d'un fichier multipart (le SDK lit
  le fichier temporaire) ; dossier `CloudinaryFolders.logo`.
- **Migration** : `organizations.logo_public_id` (nullable, jamais sérialisé).
- **Validation** : `jpg`, `jpeg`, `png`, `webp`, `svg`, 2 Mo max
  (`shared/constants/organisation.ts`). `logoUrl` n'est plus accepté en saisie
  libre par `PUT /organization`.
- **`Referrer-Policy: strict-origin-when-cross-origin`** sur toutes les réponses
  (`#middleware/security_headers_middleware`) : les pages qui affichent le logo
  n'envoient que l'origine du site à Cloudinary.
- **UI** : `VisualIdentity` (choix, aperçu, envoi `forceFormData`, suppression) ;
  `OrganizationSettings` lit l'organisation depuis les props pour afficher le
  nouveau logo.
- **Docs** : `docs/CLOUDINARY.md`, `docs/FEATURES.md`, `CLAUDE.md` ; finalité
  Cloudinary mise à jour dans `SUBPROCESSORS`.
